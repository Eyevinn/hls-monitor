const nock = require("nock");
import { HLSMonitor } from "../../src/HLSMonitor";
import { mockHLSMultivariantM3u8, mockHLSMediaM3u8Sequences } from "../util/constants";

const mockBaseUri = "https://mock.mock.com/";
const mockLiveUri = "https://mock.mock.com/channels/1xx/master.m3u8";

let mockHLSMediaM3u8Sequence = null;

describe("HLSMonitor,", () => {
  describe("parseManifests()", () => {
    beforeEach(() => {
      let mockMseq = 0;
      nock(mockBaseUri)
        .persist()
        .get("/channels/1xx/master.m3u8")
        .reply(200, () => {
          return mockHLSMultivariantM3u8;
        })
        .get("/channels/1xx/level_1.m3u8")
        .reply(200, () => {
          const m3u8 = mockHLSMediaM3u8Sequence[mockMseq];
          mockMseq++;
          return m3u8;
        });
    });
    afterEach(() => {
      nock.cleanAll();
    });

    it("should return error if: next mseq starts on wrong segment", async () => {
      // Arrange
      mockHLSMediaM3u8Sequence = mockHLSMediaM3u8Sequences[0];
      const STALE_LIMIT = 8000;
      const STREAMS = [mockLiveUri];
      const hls_monitor = new HLSMonitor(STREAMS, STALE_LIMIT);
      // Act
      await hls_monitor.incrementMonitor(STREAMS);
      await hls_monitor.incrementMonitor(STREAMS);
      await hls_monitor.incrementMonitor(STREAMS);
      await hls_monitor.stop();
      const MonitoredErrors = await hls_monitor.getErrors();
      // Assert
      const expectedError = "Error in playlist! (BW:10771383) Expected first item-uri in mseq(2) to be: 'index_2.ts'. Got: 'index_1.ts'";
      expect(MonitoredErrors[0]["errors"][0]).toContain(expectedError);
    });

    it("should return error if: next mseq is the same and contains any wrong segment", async () => {
      // Arrange
      mockHLSMediaM3u8Sequence = mockHLSMediaM3u8Sequences[1];
      const STALE_LIMIT = 8000;
      const STREAMS = [mockLiveUri];
      const hls_monitor = new HLSMonitor(STREAMS, STALE_LIMIT);
      // Act
      await hls_monitor.incrementMonitor(STREAMS);
      await hls_monitor.incrementMonitor(STREAMS);
      await hls_monitor.incrementMonitor(STREAMS);
      await hls_monitor.incrementMonitor(STREAMS);
      await hls_monitor.stop();
      const MonitoredErrors = await hls_monitor.getErrors();
      // Assert
      const expectedError = "Error in playlist! (BW:10771383) Expected playlist item-uri in mseq(2) at index(0) to be: 'index_2.ts'. Got: 'index_3.ts'";
      expect(MonitoredErrors[0]["errors"][0]).toContain(expectedError);
    });

    it("should return error if: next mseq is the same and playlist size do not match", async () => {
      // Arrange
      mockHLSMediaM3u8Sequence = mockHLSMediaM3u8Sequences[2];
      const STALE_LIMIT = 8000;
      const STREAMS = [mockLiveUri];
      const hls_monitor = new HLSMonitor(STREAMS, STALE_LIMIT);
      // Act
      await hls_monitor.incrementMonitor(STREAMS);
      await hls_monitor.incrementMonitor(STREAMS);
      await hls_monitor.incrementMonitor(STREAMS);
      await hls_monitor.incrementMonitor(STREAMS);
      await hls_monitor.stop();
      const MonitoredErrors = await hls_monitor.getErrors();
      // Assert
      const expectedError = "Error in playlist! (BW:10771383) Expected playlist size in mseq(12) to be: 3. Got: 4";
      expect(MonitoredErrors[0]["errors"][0]).toContain(expectedError);
    });

    it("should return error if: prev mseq is greater than next mseq", async () => {
      // Arrange
      mockHLSMediaM3u8Sequence = mockHLSMediaM3u8Sequences[3];
      const STALE_LIMIT = 8000;
      const STREAMS = [mockLiveUri];
      const hls_monitor = new HLSMonitor(STREAMS, STALE_LIMIT);
      // Act
      await hls_monitor.incrementMonitor(STREAMS);
      await hls_monitor.incrementMonitor(STREAMS);
      await hls_monitor.incrementMonitor(STREAMS);
      await hls_monitor.incrementMonitor(STREAMS);
      await hls_monitor.stop();
      const MonitoredErrors = await hls_monitor.getErrors();
      // Assert
      const expectedError = "Error in mediaSequence! (BW:10771383) Expected mediaSequence >= 3. Got: 2";
      expect(MonitoredErrors[0]["errors"][0]).toContain(expectedError);
    });

    it("should return error if: next mseq does not increment discontinuity-sequence correctly, too big increment", async () => {
      // Arrange
      mockHLSMediaM3u8Sequence = mockHLSMediaM3u8Sequences[4];
      const STALE_LIMIT = 8000;
      const STREAMS = [mockLiveUri];
      const hls_monitor = new HLSMonitor(STREAMS, STALE_LIMIT);
      // Act
      await hls_monitor.incrementMonitor(STREAMS);
      await hls_monitor.incrementMonitor(STREAMS);
      await hls_monitor.incrementMonitor(STREAMS);
      await hls_monitor.incrementMonitor(STREAMS);
      await hls_monitor.stop();
      const MonitoredErrors = await hls_monitor.getErrors();
      // Assert
      const expectedError = "Error in discontinuitySequence! (BW:10771383) Wrong count increment in mseq(3) - Expected: 11. Got: 12";
      expect(MonitoredErrors[0]["errors"][0]).toContain(expectedError);
    });

    it("should return error if: next mseq does not increment discontinuity-sequence correctly, no increment", async () => {
      // Arrange
      mockHLSMediaM3u8Sequence = mockHLSMediaM3u8Sequences[5];
      const STALE_LIMIT = 8000;
      const STREAMS = [mockLiveUri];
      const hls_monitor = new HLSMonitor(STREAMS, STALE_LIMIT);
      // Act
      await hls_monitor.incrementMonitor(STREAMS);
      await hls_monitor.incrementMonitor(STREAMS);
      await hls_monitor.incrementMonitor(STREAMS);
      await hls_monitor.incrementMonitor(STREAMS);
      await hls_monitor.stop();
      const MonitoredErrors = await hls_monitor.getErrors();
      // Assert
      const expectedError = "Error in discontinuitySequence! (BW:10771383) Wrong count increment in mseq(3) - Expected: 11. Got: 10";
      expect(MonitoredErrors[0]["errors"][0]).toContain(expectedError);
    });

    it("should return error if: next mseq does not increment discontinuity-sequence correctly, early increment", async () => {
      // Arrange
      mockHLSMediaM3u8Sequence = mockHLSMediaM3u8Sequences[6];
      const STALE_LIMIT = 8000;
      const STREAMS = [mockLiveUri];
      const hls_monitor = new HLSMonitor(STREAMS, STALE_LIMIT);
      // Act
      await hls_monitor.incrementMonitor(STREAMS);
      await hls_monitor.incrementMonitor(STREAMS);
      await hls_monitor.incrementMonitor(STREAMS);
      await hls_monitor.incrementMonitor(STREAMS);
      await hls_monitor.stop();
      const MonitoredErrors = await hls_monitor.getErrors();
      // Assert
      const expectedError = "Error in discontinuitySequence! (BW:10771383) Early count increment in mseq(2) - Expected: 10. Got: 11";
      expect(MonitoredErrors[0]["errors"][0]).toContain(expectedError);
    });
  });
});
