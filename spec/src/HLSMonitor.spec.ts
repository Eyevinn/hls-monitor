const nock = require("nock");
import { HLSMonitor } from "../../src/HLSMonitor";
import { mockHLSMultivariantM3u8, mockHLSMediaM3u8Sequences, TMockSequence } from "../util/testvectors";

const mockBaseUri = "https://mock.mock.com/";
const mockLiveUri = "https://mock.mock.com/channels/1xx/master.m3u8";

let mockHLSMediaM3u8Sequence: TMockSequence | undefined;
let mockMseq = 0;

describe("HLSMonitor,", () => {
  describe("parseManifests()", () => {
    beforeEach(() => {
      nock(mockBaseUri)
        .persist()
        .get("/channels/1xx/master.m3u8")
        .reply(200, () => {
          return mockHLSMultivariantM3u8;
        })
        .get("/channels/1xx/level_0.m3u8")
        .reply(200, () => {
          const level_0_ = mockHLSMediaM3u8Sequence?.[0];
          const m3u8 = level_0_?.[mockMseq];
          return m3u8;
        })
        .get("/channels/1xx/level_1.m3u8")
        .reply(200, () => {
          const level_1_ = mockHLSMediaM3u8Sequence?.[1];
          const m3u8 = level_1_?.[mockMseq];
          return m3u8;
        });
    });
    afterEach(() => {
      nock.cleanAll();
      mockMseq = 0;
    });

    it("should have an unique id and properly set stale limit and update interval", async () => {
      const STALE_LIMIT = { staleLimit: 8000, monitorInterval: 4000 };
      const STREAMS = [mockLiveUri];
      const hls_monitor_1 = new HLSMonitor(STREAMS, STALE_LIMIT);
      const hls_monitor_2 = new HLSMonitor(STREAMS);
      const id1 = hls_monitor_1.monitorId;
      const id2 = hls_monitor_2.monitorId;
      // The update interval will be set to 1/2 of the stale limit
      const monitor_1_stale_limit = hls_monitor_1.getUpdateInterval() * 2;
      const monitor_2_stale_limit = hls_monitor_2.getUpdateInterval() * 2;

      expect(id1).toBeDefined();
      expect(id1).not.toBeNull();
      expect(id1).not.toBe("");

      expect(id2).toBeDefined();
      expect(id2).not.toBeNull();
      expect(id2).not.toBe("");

      expect(id1).not.toEqual(id2);

      expect(monitor_1_stale_limit).toEqual(STALE_LIMIT.staleLimit);
      expect(monitor_2_stale_limit).toEqual(6000); // default
    });

    it("should return error if: next mseq starts on wrong segment", async () => {
      // Arrange
      mockHLSMediaM3u8Sequence = mockHLSMediaM3u8Sequences[0];
      const STALE_LIMIT = { staleLimit: 8000, monitorInterval: 4000 };
      const STREAMS = [mockLiveUri];
      const hls_monitor = new HLSMonitor(STREAMS, STALE_LIMIT);
      // Act
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.stop();
      const MonitoredErrors = await hls_monitor.getErrors();
      // Assert
      const expectedError = "Error in playlist! (BW:1212000) Faulty Segment Continuity! Expected first item-uri in mseq(2) to be: 'index_0_2.ts'. Got: 'index_0_1.ts'";
      //console.log(JSON.stringify(MonitoredErrors[0]["errors"], null, 2));
      expect(MonitoredErrors[0]["errors"][0]).toContain(expectedError);
    });

    it("should return error if: next mseq is the same and contains any wrong segment", async () => {
      // Arrange
      mockHLSMediaM3u8Sequence = mockHLSMediaM3u8Sequences[1];
      const STALE_LIMIT = { staleLimit: 8000, monitorInterval: 4000 };
      const STREAMS = [mockLiveUri];
      const hls_monitor = new HLSMonitor(STREAMS, STALE_LIMIT);
      // Act
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.stop();
      const MonitoredErrors = await hls_monitor.getErrors();
      // Assert
      const expectedError = "Error in playlist! (BW:1212000) Expected playlist item-uri in mseq(2) at index(0) to be: 'index_0_2.ts'. Got: 'index_0_3.ts'";
      expect(MonitoredErrors[0]["errors"][0]).toContain(expectedError);
    });

    it("should return error if: next mseq is the same and playlist size do not match", async () => {
      // Arrange
      mockHLSMediaM3u8Sequence = mockHLSMediaM3u8Sequences[2];
      const STALE_LIMIT = { staleLimit: 8000, monitorInterval: 4000 };
      const STREAMS = [mockLiveUri];
      const hls_monitor = new HLSMonitor(STREAMS, STALE_LIMIT);
      // Act
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.stop();
      const MonitoredErrors = await hls_monitor.getErrors();
      // Assert
      const expectedError = "Error in playlist! (BW:1212000) Expected playlist size in mseq(13) to be: 5. Got: 4";
      expect(MonitoredErrors[0]["errors"][0]).toContain(expectedError);
    });

    it("should return error if: prev mseq is greater than next mseq", async () => {
      // Arrange
      mockHLSMediaM3u8Sequence = mockHLSMediaM3u8Sequences[3];
      const STALE_LIMIT = { staleLimit: 8000, monitorInterval: 4000 };
      const STREAMS = [mockLiveUri];
      const hls_monitor = new HLSMonitor(STREAMS, STALE_LIMIT);
      // Act
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.stop();
      const MonitoredErrors = await hls_monitor.getErrors();
      // Assert
      const expectedError = "Error in mediaSequence! (BW:1212000) Expected mediaSequence >= 3. Got: 2";
      expect(MonitoredErrors[0]["errors"][0]).toContain(expectedError);
    });

    it("should return error if: next mseq does not increment discontinuity-sequence correctly, too big increment", async () => {
      // Arrange
      mockHLSMediaM3u8Sequence = mockHLSMediaM3u8Sequences[4];
      const STALE_LIMIT = { staleLimit: 8000, monitorInterval: 4000 };
      const STREAMS = [mockLiveUri];
      const hls_monitor = new HLSMonitor(STREAMS, STALE_LIMIT);
      // Act
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.stop();
      const MonitoredErrors = await hls_monitor.getErrors();
      // Assert
      const expectedError = "Error in discontinuitySequence! (BW:1212000) Wrong count increment in mseq(3) - Expected: 11. Got: 12";
      expect(MonitoredErrors[0]["errors"][0]).toContain(expectedError);
    });

    it("should return error if: next mseq does not increment discontinuity-sequence correctly, no increment", async () => {
      // Arrange
      mockHLSMediaM3u8Sequence = mockHLSMediaM3u8Sequences[5];
      const STALE_LIMIT = { staleLimit: 8000, monitorInterval: 4000 };
      const STREAMS = [mockLiveUri];
      const hls_monitor = new HLSMonitor(STREAMS, STALE_LIMIT);
      // Act
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.stop();
      const MonitoredErrors = await hls_monitor.getErrors();
      // Assert
      const expectedError = "Error in discontinuitySequence! (BW:1212000) Wrong count increment in mseq(3) - Expected: 11. Got: 10";
      expect(MonitoredErrors[0]["errors"][0]).toContain(expectedError);
    });

    it("should return error if: next mseq does not increment discontinuity-sequence correctly, early increment (tag at top)", async () => {
      // Arrange
      mockHLSMediaM3u8Sequence = mockHLSMediaM3u8Sequences[6];
      const STALE_LIMIT = { staleLimit: 8000, monitorInterval: 4000 };
      const STREAMS = [mockLiveUri];
      const hls_monitor = new HLSMonitor(STREAMS, STALE_LIMIT);
      // Act
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.stop();
      const MonitoredErrors = await hls_monitor.getErrors();
      // Assert
      const expectedError = "Error in discontinuitySequence! (BW:1212000) Early count increment in mseq(22) - Expected: 10. Got: 11";
      expect(MonitoredErrors[0]["errors"][0]).toContain(expectedError);
    });

    it("should return error if: next mseq does not increment discontinuity-sequence correctly, early increment (tag under top)", async () => {
      // Arrange
      mockHLSMediaM3u8Sequence = mockHLSMediaM3u8Sequences[7];
      const STALE_LIMIT = { staleLimit: 8000, monitorInterval: 4000 };
      const STREAMS = [mockLiveUri];
      const hls_monitor = new HLSMonitor(STREAMS, STALE_LIMIT);
      // Act
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.stop();
      const MonitoredErrors = await hls_monitor.getErrors();
      // Assert
      const expectedError = "Error in discontinuitySequence! (BW:2424000) Early count increment in mseq(21) - Expected: 10. Got: 11";
      expect(MonitoredErrors[0]["errors"][1]).toContain(expectedError);
    });

    it("should return error if: next mseq does not increment discontinuity-sequence correctly, early increment (tag under top) 2nd case", async () => {
      // Arrange
      mockHLSMediaM3u8Sequence = mockHLSMediaM3u8Sequences[8];
      const STALE_LIMIT = { staleLimit: 8000, monitorInterval: 4000 };
      const STREAMS = [mockLiveUri];
      const hls_monitor = new HLSMonitor(STREAMS, STALE_LIMIT);
      // Act
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.stop();
      const MonitoredErrors = await hls_monitor.getErrors();
      // Assert
      expect(MonitoredErrors).toEqual([]);
    });

    it("should not return error if: next mseq does not increment discontinuity-sequence correctly, early increment (tag under top) 3rd case", async () => {
      // Arrange
      mockHLSMediaM3u8Sequence = mockHLSMediaM3u8Sequences[9];
      const STALE_LIMIT = { staleLimit: 8000, monitorInterval: 4000 };
      const STREAMS = [mockLiveUri];
      const hls_monitor = new HLSMonitor(STREAMS, STALE_LIMIT);
      // Act
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.stop();
      const MonitoredErrors = await hls_monitor.getErrors();
      // Assert
      expect(MonitoredErrors).toEqual([]);
    });

    it("should not return error if: discontinuity-sequence has increased but the media-sequence difference is larger than the playlist size", async () => {
      // Arrange
      mockHLSMediaM3u8Sequence = mockHLSMediaM3u8Sequences[10];
      const STALE_LIMIT = { staleLimit: 8000, monitorInterval: 4000 };
      const STREAMS = [mockLiveUri];
      const hls_monitor = new HLSMonitor(STREAMS, STALE_LIMIT);
      // Act
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.incrementMonitor(STREAMS);
      mockMseq++;
      await hls_monitor.stop();
      const MonitoredErrors = await hls_monitor.getErrors();
      // Assert
      expect(MonitoredErrors).toEqual([]);
    });
  });
});
