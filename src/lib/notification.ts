import { SUPPORTED_KINDS } from '@/constants'
import { kinds, NostrEvent } from 'nostr-tools'
import { getEventAuthorPubkey, isMentioningMutedUsers } from './event'
import { tagNameEquals } from './tag'

export async function notificationFilter(
  event: NostrEvent,
  {
    pubkey,
    mutePubkeySet,
    hideContentMentioningMutedUsers,
    meetsMinTrustScore
  }: {
    pubkey?: string | null
    mutePubkeySet: Set<string>
    hideContentMentioningMutedUsers?: boolean
    meetsMinTrustScore: (pubkey: string) => Promise<boolean>
  }
): Promise<boolean> {
  const authorPubkey = getEventAuthorPubkey(event)
  if (
    mutePubkeySet.has(authorPubkey) ||
    (hideContentMentioningMutedUsers && isMentioningMutedUsers(event, mutePubkeySet)) ||
    !(await meetsMinTrustScore(authorPubkey))
  ) {
    return false
  }

  if (event.kind === kinds.Reaction) {
    if (pubkey) {
      const targetPubkey = event.tags.findLast(tagNameEquals('p'))?.[1]
      if (targetPubkey !== pubkey) return false
    }

    // NIP-25 reactions to kind 1 may omit the k tag. Other target kinds
    // should declare it so clients can decide whether they support the target.
    const targetKindTag = event.tags.findLast(tagNameEquals('k'))
    const targetKind = targetKindTag ? Number(targetKindTag[1]) : kinds.ShortTextNote
    if (!Number.isInteger(targetKind) || !SUPPORTED_KINDS.includes(targetKind)) return false
  }

  return true
}
