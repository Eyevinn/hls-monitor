export const mockHLSMultivariantM3u8 = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=10771383,AVERAGE-BANDWIDTH=920866,RESOLUTION=1280x720,FRAME-RATE=30.000,CODECS="avc1.4D4020,mp4a.40.2",AUDIO="audio_0"
level_1.m3u8
`;

const mockSequence1 = {
  0: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:0
    #EXTINF:10.000,
    index_0.ts
    #EXTINF:10.000,
    index_1.ts`,
  1: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:1
    #EXTINF:10.000,
    index_1.ts
    #EXTINF:10.000,
    index_2.ts`,
  2: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:2
    #EXTINF:10.000,
    index_1.ts
    #EXTINF:10.000,
    index_2.ts`,
  3: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:3
    #EXTINF:10.000,
    index_2.ts
    #EXTINF:10.000,
    index_3.ts`,
};

const mockSequence2 = {
  0: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:0
    #EXTINF:10.000,
    index_0.ts
    #EXTINF:10.000,
    index_1.ts`,
  1: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:1
    #EXTINF:10.000,
    index_1.ts
    #EXTINF:10.000,
    index_2.ts`,
  2: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:2
    #EXTINF:10.000,
    index_2.ts
    #EXTINF:10.000,
    index_3.ts`,
  3: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:2
    #EXTINF:10.000,
    index_3.ts
    #EXTINF:10.000,
    index_4.ts`,
};

const mockSequence3 = {
  0: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:10
    #EXTINF:10.000,
    index_0.ts
    #EXTINF:10.000,
    index_1.ts
    #EXTINF:10.000,
    index_2.ts`,
  1: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:11
    #EXTINF:10.000,
    index_1.ts
    #EXTINF:10.000,
    index_2.ts
    #EXTINF:10.000,
    index_3.ts`,
  2: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:12
    #EXTINF:10.000,
    index_2.ts
    #EXTINF:10.000,
    index_3.ts
    #EXTINF:10.000,
    index_4.ts`,
  3: `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:12
#EXTINF:10.000,
index_2.ts
#EXTINF:10.000,
index_3.ts
#EXTINF:10.000,
index_4.ts
#EXTINF:10.000,
index_5.ts`,
};

const mockSequence4 = {
  0: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:0
    #EXTINF:10.000,
    index_0.ts
    #EXTINF:10.000,
    index_1.ts`,
  1: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:1
    #EXTINF:10.000,
    index_1.ts
    #EXTINF:10.000,
    index_2.ts`,
  2: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:3
    #EXTINF:10.000,
    index_3.ts
    #EXTINF:10.000,
    index_4.ts`,
  3: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:2
    #EXTINF:10.000,
    index_2.ts
    #EXTINF:10.000,
    index_3.ts`,
};

const mockSequence5 = {
  0: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:0
    #EXT-X-DISCONTINUITY-SEQUENCE:10
    #EXTINF:10.000,
    index_0.ts
    #EXTINF:10.000,
    index_1.ts`,
  1: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:1
    #EXT-X-DISCONTINUITY-SEQUENCE:10
    #EXTINF:10.000,
    index_1.ts
    #EXT-X-DISCONTINUITY
    #EXTINF:10.000,
    other_1.ts`,
  2: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:2
    #EXT-X-DISCONTINUITY-SEQUENCE:10
    #EXT-X-DISCONTINUITY
    #EXTINF:10.000,
    other_1.ts
    #EXTINF:10.000,
    other_2.ts`,
  3: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:3
    #EXT-X-DISCONTINUITY-SEQUENCE:12
    #EXTINF:10.000,
    other_2.ts
    #EXTINF:10.000,
    other_3.ts`,
};

const mockSequence6 = {
  0: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:0
    #EXT-X-DISCONTINUITY-SEQUENCE:10
    #EXTINF:10.000,
    index_0.ts
    #EXTINF:10.000,
    index_1.ts`,
  1: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:1
    #EXT-X-DISCONTINUITY-SEQUENCE:10
    #EXTINF:10.000,
    index_1.ts
    #EXT-X-DISCONTINUITY
    #EXTINF:10.000,
    other_1.ts`,
  2: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:2
    #EXT-X-DISCONTINUITY-SEQUENCE:10
    #EXT-X-DISCONTINUITY
    #EXTINF:10.000,
    other_1.ts
    #EXTINF:10.000,
    other_2.ts`,
  3: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:3
    #EXT-X-DISCONTINUITY-SEQUENCE:10
    #EXTINF:10.000,
    other_2.ts
    #EXTINF:10.000,
    other_3.ts`,
};

const mockSequence7 = {
  0: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:0
    #EXT-X-DISCONTINUITY-SEQUENCE:10
    #EXTINF:10.000,
    index_0.ts
    #EXTINF:10.000,
    index_1.ts`,
  1: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:1
    #EXT-X-DISCONTINUITY-SEQUENCE:10
    #EXTINF:10.000,
    index_1.ts
    #EXT-X-DISCONTINUITY
    #EXTINF:10.000,
    other_1.ts`,
  2: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:2
    #EXT-X-DISCONTINUITY-SEQUENCE:11
    #EXT-X-DISCONTINUITY
    #EXTINF:10.000,
    other_1.ts
    #EXTINF:10.000,
    other_2.ts`,
  3: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:3
    #EXT-X-DISCONTINUITY-SEQUENCE:11
    #EXTINF:10.000,
    other_2.ts
    #EXTINF:10.000,
    other_3.ts`,
};

export const mockHLSMediaM3u8Sequences: { [mseq: number]: string }[] = [mockSequence1, mockSequence2, mockSequence3, mockSequence4, mockSequence5, mockSequence6, mockSequence7];
