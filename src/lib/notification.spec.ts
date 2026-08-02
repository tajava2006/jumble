import { ExtendedKind } from '@/constants'
import { kinds, type NostrEvent } from 'nostr-tools'
import { describe, expect, it, vi } from 'vitest'
import { notificationFilter } from './notification'

vi.mock('@/services/client.service', () => ({ default: {} }))

const currentPubkey = '1'.repeat(64)

function createEvent({
  kind = kinds.Reaction,
  tags = []
}: {
  kind?: number
  tags?: string[][]
} = {}): NostrEvent {
  return {
    id: '2'.repeat(64),
    pubkey: '3'.repeat(64),
    created_at: 1,
    kind,
    tags,
    content: '+',
    sig: '4'.repeat(128)
  }
}

function filter(event: NostrEvent, pubkey: string | null = currentPubkey) {
  return notificationFilter(event, {
    pubkey,
    mutePubkeySet: new Set(),
    meetsMinTrustScore: async () => true
  })
}

describe('notificationFilter', () => {
  it('keeps a reaction without a k tag as a kind 1 reaction', async () => {
    const event = createEvent({ tags: [['p', currentPubkey]] })

    await expect(filter(event)).resolves.toBe(true)
  })

  it.each([ExtendedKind.PICTURE, kinds.CommunityDefinition, ExtendedKind.GROUP_METADATA])(
    'keeps a reaction to supported kind %i',
    async (targetKind) => {
      const event = createEvent({
        tags: [
          ['p', currentPubkey],
          ['k', targetKind.toString()]
        ]
      })

      await expect(filter(event)).resolves.toBe(true)
    }
  )

  it('filters a reaction to an unsupported event kind', async () => {
    const event = createEvent({
      tags: [
        ['p', currentPubkey],
        ['k', kinds.Metadata.toString()]
      ]
    })

    await expect(filter(event)).resolves.toBe(false)
  })

  it('filters an unsupported reaction before the current account is available', async () => {
    const event = createEvent({ tags: [['k', kinds.Metadata.toString()]] })

    await expect(filter(event, null)).resolves.toBe(false)
  })

  it('filters a reaction with a malformed target kind', async () => {
    const event = createEvent({
      tags: [
        ['p', currentPubkey],
        ['k', 'not-a-kind']
      ]
    })

    await expect(filter(event)).resolves.toBe(false)
  })

  it('does not apply the target-kind check to other notification types', async () => {
    const event = createEvent({
      kind: kinds.Repost,
      tags: [
        ['p', currentPubkey],
        ['k', kinds.Metadata.toString()]
      ]
    })

    await expect(filter(event)).resolves.toBe(true)
  })
})
