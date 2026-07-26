// Tester sample sizes — keep workloads manageable.

export const SAMPLE = {
  /** Characters reviewed in the quality sample session. */
  characterReview: 25,
  /** Chats in the standard chat test (understanding + realism worksheets). */
  chatConversations: 5,
  /** Target AI replies per chat in the standard chat test. */
  chatRepliesPerChat: 20,
  /** Images in the batch review worksheet. */
  imageBatch: 20,
  /** Same-character consistency images. */
  imageConsistency: 5,
  /** Videos in the batch review worksheet. */
  videoBatch: 5,
  /** Refusal-test prompts (reliability session). */
  refusalPrompts: 25,
  /** Replies timed for speed test. */
  speedTestReplies: 25,
} as const;

/** Total replies in the standard chat sample. */
export function chatReplyTotal(): number {
  return SAMPLE.chatConversations * SAMPLE.chatRepliesPerChat;
}
