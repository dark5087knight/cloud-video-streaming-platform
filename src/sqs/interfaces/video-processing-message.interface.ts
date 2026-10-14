export interface VideoProcessingRenditionSpec {
  renditionId: string;
  profileKey: string;
  width: number;
  height: number;
  videoCodec: string;
  audioCodec?: string;
  videoBitrateBps: number;
  audioBitrateBps: number;
  storageKey: string;
}

export interface VideoProcessingMessage {
  jobId: string;
  videoId: string;
  jobType: 'transcode' | 'probe' | 'thumbnail';
  source: {
    bucket: string;
    key: string;
    format?: string;
    sizeBytes?: number;
  };
  renditions: VideoProcessingRenditionSpec[];
  attempt: number;
  maxAttempts: number;
  createdAt: string;
}
