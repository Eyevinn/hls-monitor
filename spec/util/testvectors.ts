type TMockVariantSequence = {
  [mseq: number]: string;
};
export type TMockSequence = TMockVariantSequence[];

export const mockHLSMultivariantM3u8 = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=1212000,RESOLUTION=1280x720,FRAME-RATE=30.000
level_0.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2424000,RESOLUTION=1280x720,FRAME-RATE=30.000
level_1.m3u8
`;

const mockSequence1: TMockSequence = [
  // level 0
  {
    0: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:0
    #EXTINF:10.000,
    index_0_0.ts
    #EXTINF:10.000,
    index_0_1.ts`,
    1: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:1
    #EXTINF:10.000,
    index_0_1.ts
    #EXTINF:10.000,
    index_0_2.ts`,
    2: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:2
    #EXTINF:10.000,
    index_0_1.ts
    #EXTINF:10.000,
    index_0_2.ts`,
    3: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:3
    #EXTINF:10.000,
    index_0_2.ts
    #EXTINF:10.000,
    index_0_3.ts`,
  },
  // level 1
  {
    0: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:0
    #EXTINF:10.000,
    index_1_0.ts
    #EXTINF:10.000,
    index_1_1.ts`,
    1: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:1
    #EXTINF:10.000,
    index_1_1.ts
    #EXTINF:10.000,
    index_1_2.ts`,
    2: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:2
    #EXTINF:10.000,
    index_1_1.ts
    #EXTINF:10.000,
    index_1_2.ts`,
    3: `#EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:3
    #EXTINF:10.000,
    index_1_2.ts
    #EXTINF:10.000,
    index_1_3.ts`,
  },
];

const mockSequence2: TMockSequence = [
  // level 0
  {
    0: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:0
      #EXTINF:10.000,
      index_0_0.ts
      #EXTINF:10.000,
      index_0_1.ts`,
    1: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:1
      #EXTINF:10.000,
      index_0_1.ts
      #EXTINF:10.000,
      index_0_2.ts`,
    2: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:2
      #EXTINF:10.000,
      index_0_2.ts
      #EXTINF:10.000,
      index_0_3.ts`,
    3: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:2
      #EXTINF:10.000,
      index_0_3.ts
      #EXTINF:10.000,
      index_0_4.ts`,
  },
  // level 1
  {
    0: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:0
      #EXTINF:10.000,
      index_1_0.ts
      #EXTINF:10.000,
      index_1_1.ts`,
    1: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:1
      #EXTINF:10.000,
      index_1_1.ts
      #EXTINF:10.000,
      index_1_2.ts`,
    2: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:2
      #EXTINF:10.000,
      index_1_2.ts
      #EXTINF:10.000,
      index_1_3.ts`,
    3: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:2
      #EXTINF:10.000,
      index_1_3.ts
      #EXTINF:10.000,
      index_1_4.ts`,
  },
];

const mockSequence3: TMockSequence = [
  // level 0
  {
    0: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:10
      #EXTINF:10.000,
      index_0_0.ts
      #EXTINF:10.000,
      index_0_1.ts
      #EXTINF:10.000,
      index_0_2.ts`,
    1: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:11
      #EXTINF:10.000,
      index_0_1.ts
      #EXTINF:10.000,
      index_0_2.ts
      #EXTINF:10.000,
      index_0_3.ts`,
    2: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:12
      #EXTINF:10.000,
      index_0_2.ts
      #EXTINF:10.000,
      index_0_3.ts
      #EXTINF:10.000,
      index_0_4.ts`,
    3: `#EXTM3U
  #EXT-X-VERSION:3
  #EXT-X-TARGETDURATION:10
  #EXT-X-MEDIA-SEQUENCE:12
  #EXTINF:10.000,
  index_0_2.ts
  #EXTINF:10.000,
  index_0_3.ts
  #EXTINF:10.000,
  index_0_4.ts
  #EXTINF:10.000,
  index_0_5.ts`,
    4: `#EXTM3U
  #EXT-X-VERSION:3
  #EXT-X-TARGETDURATION:10
  #EXT-X-MEDIA-SEQUENCE:13
  #EXTINF:10.000,
  index_0_3.ts
  #EXTINF:10.000,
  index_0_4.ts
  #EXTINF:10.000,
  index_0_5.ts
  #EXTINF:10.000,
  index_0_6.ts
  #EXTINF:10.000,
  index_0_7.ts`,
    5: `#EXTM3U
  #EXT-X-VERSION:3
  #EXT-X-TARGETDURATION:10
  #EXT-X-MEDIA-SEQUENCE:13
  #EXTINF:10.000,
  index_0_3.ts
  #EXTINF:10.000,
  index_0_4.ts
  #EXTINF:10.000,
  index_0_5.ts
  #EXTINF:10.000,
  index_0_6.ts`,
  },
  // level 1
  {
    0: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:10
      #EXTINF:10.000,
      index_1_0.ts
      #EXTINF:10.000,
      index_1_1.ts
      #EXTINF:10.000,
      index_1_2.ts`,
    1: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:11
      #EXTINF:10.000,
      index_1_1.ts
      #EXTINF:10.000,
      index_1_2.ts
      #EXTINF:10.000,
      index_1_3.ts`,
    2: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:12
      #EXTINF:10.000,
      index_1_2.ts
      #EXTINF:10.000,
      index_1_3.ts
      #EXTINF:10.000,
      index_1_4.ts`,
    3: `#EXTM3U
  #EXT-X-VERSION:3
  #EXT-X-TARGETDURATION:10
  #EXT-X-MEDIA-SEQUENCE:12
  #EXTINF:10.000,
  index_1_2.ts
  #EXTINF:10.000,
  index_1_3.ts
  #EXTINF:10.000,
  index_1_4.ts
  #EXTINF:10.000,
  index_1_5.ts`,
    4: `#EXTM3U
  #EXT-X-VERSION:3
  #EXT-X-TARGETDURATION:10
  #EXT-X-MEDIA-SEQUENCE:13
  #EXTINF:10.000,
  index_1_3.ts
  #EXTINF:10.000,
  index_1_4.ts
  #EXTINF:10.000,
  index_1_5.ts
  #EXTINF:10.000,
  index_1_6.ts
  #EXTINF:10.000,
  index_1_7.ts`,
    5: `#EXTM3U
  #EXT-X-VERSION:3
  #EXT-X-TARGETDURATION:10
  #EXT-X-MEDIA-SEQUENCE:13
  #EXTINF:10.000,
  index_1_3.ts
  #EXTINF:10.000,
  index_1_4.ts
  #EXTINF:10.000,
  index_1_5.ts
  #EXTINF:10.000,
  index_1_6.ts`,
  },
];

const mockSequence4: TMockSequence = [
  // level 0
  {
    0: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:0
      #EXTINF:10.000,
      index_0_0.ts
      #EXTINF:10.000,
      index_0_1.ts`,
    1: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:1
      #EXTINF:10.000,
      index_0_1.ts
      #EXTINF:10.000,
      index_0_2.ts`,
    2: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:3
      #EXTINF:10.000,
      index_0_3.ts
      #EXTINF:10.000,
      index_0_4.ts`,
    3: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:2
      #EXTINF:10.000,
      index_0_2.ts
      #EXTINF:10.000,
      index_0_3.ts`,
  },
  // level 1
  {
    0: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:0
      #EXTINF:10.000,
      index_1_0.ts
      #EXTINF:10.000,
      index_1_1.ts`,
    1: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:1
      #EXTINF:10.000,
      index_1_1.ts
      #EXTINF:10.000,
      index_1_2.ts`,
    2: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:3
      #EXTINF:10.000,
      index_1_3.ts
      #EXTINF:10.000,
      index_1_4.ts`,
    3: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:2
      #EXTINF:10.000,
      index_1_2.ts
      #EXTINF:10.000,
      index_1_3.ts`,
  },
];

const mockSequence5: TMockSequence = [
  // level 0
  {
    0: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:0
      #EXT-X-DISCONTINUITY-SEQUENCE:10
      #EXTINF:10.000,
      index_0_0.ts
      #EXTINF:10.000,
      index_0_1.ts`,
    1: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:1
      #EXT-X-DISCONTINUITY-SEQUENCE:10
      #EXTINF:10.000,
      index_0_1.ts
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      other_0_1.ts`,
    2: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:2
      #EXT-X-DISCONTINUITY-SEQUENCE:10
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      other_0_1.ts
      #EXTINF:10.000,
      other_0_2.ts`,
    3: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:3
      #EXT-X-DISCONTINUITY-SEQUENCE:12
      #EXTINF:10.000,
      other_0_2.ts
      #EXTINF:10.000,
      other_0_3.ts`,
  },
  // level 1
  {
    0: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:0
      #EXT-X-DISCONTINUITY-SEQUENCE:10
      #EXTINF:10.000,
      index_1_0.ts
      #EXTINF:10.000,
      index_1_1.ts`,
    1: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:1
      #EXT-X-DISCONTINUITY-SEQUENCE:10
      #EXTINF:10.000,
      index_1_1.ts
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      other_1_1.ts`,
    2: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:2
      #EXT-X-DISCONTINUITY-SEQUENCE:10
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      other_1_1.ts
      #EXTINF:10.000,
      other_1_2.ts`,
    3: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:3
      #EXT-X-DISCONTINUITY-SEQUENCE:12
      #EXTINF:10.000,
      other_1_2.ts
      #EXTINF:10.000,
      other_1_3.ts`,
  },
];

const mockSequence6: TMockSequence = [
  // level 0
  {
    0: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:0
      #EXT-X-DISCONTINUITY-SEQUENCE:10
      #EXTINF:10.000,
      index_0_0.ts
      #EXTINF:10.000,
      index_0_1.ts`,
    1: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:1
      #EXT-X-DISCONTINUITY-SEQUENCE:10
      #EXTINF:10.000,
      index_0_1.ts
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      other_0_1.ts`,
    2: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:2
      #EXT-X-DISCONTINUITY-SEQUENCE:10
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      other_0_1.ts
      #EXTINF:10.000,
      other_0_2.ts`,
    3: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:3
      #EXT-X-DISCONTINUITY-SEQUENCE:10
      #EXTINF:10.000,
      other_0_2.ts
      #EXTINF:10.000,
      other_0_3.ts`,
  },
  // level 1
  {
    0: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:0
      #EXT-X-DISCONTINUITY-SEQUENCE:10
      #EXTINF:10.000,
      index_1_0.ts
      #EXTINF:10.000,
      index_1_1.ts`,
    1: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:1
      #EXT-X-DISCONTINUITY-SEQUENCE:10
      #EXTINF:10.000,
      index_1_1.ts
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      other_1_1.ts`,
    2: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:2
      #EXT-X-DISCONTINUITY-SEQUENCE:10
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      other_1_1.ts
      #EXTINF:10.000,
      other_1_2.ts`,
    3: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:3
      #EXT-X-DISCONTINUITY-SEQUENCE:10
      #EXTINF:10.000,
      other_1_2.ts
      #EXTINF:10.000,
      other_1_3.ts`,
  },
];
const mockSequence7: TMockSequence = [
  // level 0
  {
    0: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:20
      #EXT-X-DISCONTINUITY-SEQUENCE:10
      #EXTINF:10.000,
      index_0_0.ts
      #EXTINF:10.000,
      index_0_1.ts`,
    1: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:21
      #EXT-X-DISCONTINUITY-SEQUENCE:10
      #EXTINF:10.000,
      index_0_1.ts
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      other_0_1.ts`,
    2: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:22
      #EXT-X-DISCONTINUITY-SEQUENCE:11
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      other_0_1.ts
      #EXTINF:10.000,
      other_0_2.ts`,
    3: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:23
      #EXT-X-DISCONTINUITY-SEQUENCE:11
      #EXTINF:10.000,
      other_0_2.ts
      #EXTINF:10.000,
      other_0_3.ts`,
  },
  // level 1
  {
    0: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:20
      #EXT-X-DISCONTINUITY-SEQUENCE:10
      #EXTINF:10.000,
      index_1_0.ts
      #EXTINF:10.000,
      index_1_1.ts`,
    1: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:21
      #EXT-X-DISCONTINUITY-SEQUENCE:10
      #EXTINF:10.000,
      index_1_1.ts
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      other_1_1.ts`,
    2: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:22
      #EXT-X-DISCONTINUITY-SEQUENCE:11
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      other_1_1.ts
      #EXTINF:10.000,
      other_1_2.ts`,
    3: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:23
      #EXT-X-DISCONTINUITY-SEQUENCE:11
      #EXTINF:10.000,
      other_1_2.ts
      #EXTINF:10.000,
      other_1_3.ts`,
  },
];

const mockSequence8: TMockSequence = [
  // level 0
  {
    0: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:20
      #EXT-X-DISCONTINUITY-SEQUENCE:10
      #EXTINF:10.000,
      index_0_0.ts
      #EXTINF:10.000,
      index_0_1.ts
      #EXTINF:10.000,
      index_0_2.ts`,
    1: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:21
      #EXT-X-DISCONTINUITY-SEQUENCE:11
      #EXTINF:10.000,
      index_0_1.ts
      #EXTINF:10.000,
      index_0_2.ts
      #EXT-X-DISCONTINUITY
      #EXT-X-CUE-IN
      #EXTINF:10.000,
      other_0_1.ts`,
    2: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:24
      #EXT-X-DISCONTINUITY-SEQUENCE:11
      #EXT-X-CUE-IN
      #EXTINF:10.000,
      other_0_1.ts
      #EXTINF:10.000,
      other_0_2.ts`,
    3: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:25
      #EXT-X-DISCONTINUITY-SEQUENCE:11
      #EXTINF:10.000,
      other_0_2.ts
      #EXTINF:10.000,
      other_0_3.ts`,
  },
  // level 1
  {
    0: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:20
      #EXT-X-DISCONTINUITY-SEQUENCE:10
      #EXTINF:10.000,
      index_1_0.ts
      #EXTINF:10.000,
      index_1_1.ts
      #EXTINF:10.000,
      index_1_2.ts`,
    1: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:21
      #EXT-X-DISCONTINUITY-SEQUENCE:11
      #EXTINF:10.000,
      index_1_1.ts
      #EXTINF:10.000,
      index_1_2.ts
      #EXT-X-DISCONTINUITY
      #EXT-X-CUE-IN
      #EXTINF:10.000,
      other_1_1.ts`,
    2: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:24
      #EXT-X-DISCONTINUITY-SEQUENCE:11
      #EXT-X-CUE-IN
      #EXTINF:10.000,
      other_1_1.ts
      #EXTINF:10.000,
      other_1_2.ts`,
    3: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:25
      #EXT-X-DISCONTINUITY-SEQUENCE:11
      #EXTINF:10.000,
      other_1_2.ts
      #EXTINF:10.000,
      other_1_3.ts`,
  },
];

const mockSequence9: TMockSequence = [
  // level 0
  {
    0: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:19
      #EXT-X-DISCONTINUITY-SEQUENCE:10
      #EXTINF:10.000,
      index_0_00.ts
      #EXTINF:10.000,
      index_0_0.ts
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      next_0_0.ts
      #EXTINF:10.000,
      next_0_1.ts
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      other_0_0.ts`,
    1: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:20
      #EXT-X-DISCONTINUITY-SEQUENCE:10
      #EXTINF:10.000,
      index_0_0.ts
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      next_0_0.ts
      #EXTINF:10.000,
      next_0_1.ts
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      other_0_0.ts
      #EXTINF:10.000,
      other_0_1.ts`,
    2: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:23
      #EXT-X-DISCONTINUITY-SEQUENCE:11
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      other_0_0.ts
      #EXTINF:10.000,
      other_0_1.ts
      #EXTINF:10.000,
      other_0_2.ts
      #EXTINF:10.000,
      other_0_3.ts
      #EXTINF:10.000,
      other_0_4.ts`,
  },
  // level 1
  {
    0: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:19
      #EXT-X-DISCONTINUITY-SEQUENCE:10
      #EXTINF:10.000,
      index_1_00.ts
      #EXTINF:10.000,
      index_1_0.ts
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      next_1_0.ts
      #EXTINF:10.000,
      next_1_1.ts
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      other_1_0.ts`,
    1: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:20
      #EXT-X-DISCONTINUITY-SEQUENCE:10
      #EXTINF:10.000,
      index_1_0.ts
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      next_1_0.ts
      #EXTINF:10.000,
      next_1_1.ts
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      other_1_0.ts
      #EXTINF:10.000,
      other_1_1.ts`,
    2: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:23
      #EXT-X-DISCONTINUITY-SEQUENCE:11
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      other_1_0.ts
      #EXTINF:10.000,
      other_1_1.ts
      #EXTINF:10.000,
      other_1_2.ts
      #EXTINF:10.000,
      other_1_3.ts
      #EXTINF:10.000,
      other_1_4.ts`,
  },
];

// A Passable Case
const mockSequence10: TMockSequence = [
  // level 0
  {
    0: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:19
      #EXT-X-DISCONTINUITY-SEQUENCE:10
      #EXTINF:10.000,
      vod_0_0.ts
      #EXTINF:10.000,
      vod_0_1.ts
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      slate_0_0.ts
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      nextvod_0_0.ts
      #EXT-X-DISCONTINUITY
      #EXT-X-CUE-OUT:DURATION=136
      #EXTINF:10.000,
      live_0_0.ts`,
    1: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:20
      #EXT-X-DISCONTINUITY-SEQUENCE:10
      #EXTINF:10.000,
      vod_0_1.ts
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      slate_0_0.ts
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      nextvod_0_0.ts
      #EXT-X-DISCONTINUITY
      #EXT-X-CUE-OUT:DURATION=136
      #EXTINF:10.000,
      live_0_0.ts
      #EXTINF:10.000,
      live_0_1.ts`,
    2: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:23
      #EXT-X-DISCONTINUITY-SEQUENCE:12
      #EXT-X-DISCONTINUITY
      #EXT-X-CUE-OUT:DURATION=136
      #EXTINF:10.000,
      live_0_0.ts
      #EXTINF:10.000,
      live_0_1.ts
      #EXTINF:10.000,
      live_0_2.ts
      #EXTINF:10.000,
      live_0_3.ts`,
    3: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:24
      #EXT-X-DISCONTINUITY-SEQUENCE:13
      #EXTINF:10.000,
      live_0_1.ts
      #EXTINF:10.000,
      live_0_2.ts
      #EXTINF:10.000,
      live_0_3.ts
      #EXTINF:10.000,
      live_0_4.ts`,
  },
  // level 1
  {
    0: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:19
      #EXT-X-DISCONTINUITY-SEQUENCE:10
      #EXTINF:10.000,
      vod_1_0.ts
      #EXTINF:10.000,
      vod_1_1.ts
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      slate_1_0.ts
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      nextvod_1_0.ts
      #EXT-X-DISCONTINUITY
      #EXT-X-CUE-OUT:DURATION=136
      #EXTINF:10.000,
      live_1_0.ts`,
    1: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:20
      #EXT-X-DISCONTINUITY-SEQUENCE:10
      #EXTINF:10.000,
      vod_1_1.ts
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      slate_1_0.ts
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      nextvod_1_0.ts
      #EXT-X-DISCONTINUITY
      #EXT-X-CUE-OUT:DURATION=136
      #EXTINF:10.000,
      live_1_0.ts
      #EXTINF:10.000,
      live_1_1.ts`,
    2: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:23
      #EXT-X-DISCONTINUITY-SEQUENCE:12
      #EXT-X-DISCONTINUITY
      #EXT-X-CUE-OUT:DURATION=136
      #EXTINF:10.000,
      live_1_0.ts
      #EXTINF:10.000,
      live_1_1.ts
      #EXTINF:10.000,
      live_1_2.ts
      #EXTINF:10.000,
      live_1_3.ts`,
    3: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:24
      #EXT-X-DISCONTINUITY-SEQUENCE:13
      #EXTINF:10.000,
      live_1_1.ts
      #EXTINF:10.000,
      live_1_2.ts
      #EXTINF:10.000,
      live_1_3.ts
      #EXTINF:10.000,
      live_1_4.ts`,
  },
];
// A Passable Case
const mockSequence11: TMockSequence = [
  // level 0
  {
    0: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:19
      #EXT-X-DISCONTINUITY-SEQUENCE:10
      #EXTINF:10.000,
      vod_0_0.ts
      #EXTINF:10.000,
      vod_0_1.ts
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      slate_0_0.ts
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      nextvod_0_0.ts
      #EXT-X-DISCONTINUITY
      #EXT-X-CUE-OUT:DURATION=136
      #EXTINF:10.000,
      live_0_0.ts`,
    1: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:20
      #EXT-X-DISCONTINUITY-SEQUENCE:10
      #EXTINF:10.000,
      vod_0_1.ts
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      slate_0_0.ts
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      nextvod_0_0.ts
      #EXT-X-DISCONTINUITY
      #EXT-X-CUE-OUT:DURATION=136
      #EXTINF:10.000,
      live_0_0.ts
      #EXTINF:10.000,
      live_0_1.ts`,
    2: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:123
      #EXT-X-DISCONTINUITY-SEQUENCE:12
      #EXT-X-DISCONTINUITY
      #EXT-X-CUE-OUT:DURATION=136
      #EXTINF:10.000,
      live_0_0.ts
      #EXTINF:10.000,
      live_0_1.ts
      #EXTINF:10.000,
      live_0_2.ts
      #EXTINF:10.000,
      live_0_3.ts`,
    3: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:124
      #EXT-X-DISCONTINUITY-SEQUENCE:13
      #EXTINF:10.000,
      live_0_1.ts
      #EXTINF:10.000,
      live_0_2.ts
      #EXTINF:10.000,
      live_0_3.ts
      #EXTINF:10.000,
      live_0_4.ts`,
  },
  // level 1
  {
    0: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:19
      #EXT-X-DISCONTINUITY-SEQUENCE:10
      #EXTINF:10.000,
      vod_1_0.ts
      #EXTINF:10.000,
      vod_1_1.ts
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      slate_1_0.ts
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      nextvod_1_0.ts
      #EXT-X-DISCONTINUITY
      #EXT-X-CUE-OUT:DURATION=136
      #EXTINF:10.000,
      live_1_0.ts`,
    1: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:20
      #EXT-X-DISCONTINUITY-SEQUENCE:10
      #EXTINF:10.000,
      vod_1_1.ts
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      slate_1_0.ts
      #EXT-X-DISCONTINUITY
      #EXTINF:10.000,
      nextvod_1_0.ts
      #EXT-X-DISCONTINUITY
      #EXT-X-CUE-OUT:DURATION=136
      #EXTINF:10.000,
      live_1_0.ts
      #EXTINF:10.000,
      live_1_1.ts`,
    2: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:123
      #EXT-X-DISCONTINUITY-SEQUENCE:12
      #EXT-X-DISCONTINUITY
      #EXT-X-CUE-OUT:DURATION=136
      #EXTINF:10.000,
      live_1_0.ts
      #EXTINF:10.000,
      live_1_1.ts
      #EXTINF:10.000,
      live_1_2.ts
      #EXTINF:10.000,
      live_1_3.ts`,
    3: `#EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:10
      #EXT-X-MEDIA-SEQUENCE:124
      #EXT-X-DISCONTINUITY-SEQUENCE:13
      #EXTINF:10.000,
      live_1_1.ts
      #EXTINF:10.000,
      live_1_2.ts
      #EXTINF:10.000,
      live_1_3.ts
      #EXTINF:10.000,
      live_1_4.ts`,
  },
];

export const mockHLSMediaM3u8Sequences: TMockSequence[] = [
  mockSequence1,
  mockSequence2,
  mockSequence3,
  mockSequence4,
  mockSequence5,
  mockSequence6,
  mockSequence7,
  mockSequence8,
  mockSequence9,
  mockSequence10,
  mockSequence11
];
