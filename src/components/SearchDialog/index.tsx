import { SecondaryPageLink } from '@/PageManager'
import { CommandDialog, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { useSearchProfiles } from '@/hooks'
import { toNote, toNoteList, toProfile, toProfileList, toRelay } from '@/lib/link'
import { normalizeUrl } from '@/lib/url'
import { TProfile } from '@/types'
import { Hash, Notebook, Server, UserRound } from 'lucide-react'
import { nip19 } from 'nostr-tools'
import { Dispatch, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Nip05 from '../Nip05'
import UserAvatar from '../UserAvatar'
import Username from '../Username'

export function SearchDialog({ open, setOpen }: { open: boolean; setOpen: Dispatch<boolean> }) {
  const { t } = useTranslation()
  const [input, setInput] = useState('')
  const [debouncedInput, setDebouncedInput] = useState(input)
  const { profiles } = useSearchProfiles(debouncedInput, 10)
  const normalizedUrl = useMemo(() => {
    if (['w', 'ws', 'ws:', 'ws:/', 'wss', 'wss:', 'wss:/'].includes(input)) {
      return undefined
    }
    try {
      return normalizeUrl(input)
    } catch {
      return undefined
    }
  }, [input])

  const list = useMemo(() => {
    const search = input.trim()
    if (!search) return

    if (/^[0-9a-f]{64}$/.test(search)) {
      return (
        <>
          <NoteItem id={search} onClick={() => setOpen(false)} />
          <ProfileIdItem id={search} onClick={() => setOpen(false)} />
        </>
      )
    }

    try {
      let id = search
      if (id.startsWith('nostr:')) {
        id = id.slice(6)
      }
      const { type } = nip19.decode(id)
      if (['nprofile', 'npub'].includes(type)) {
        return <ProfileIdItem id={id} onClick={() => setOpen(false)} />
      }
      if (['nevent', 'naddr', 'note'].includes(type)) {
        return <NoteItem id={id} onClick={() => setOpen(false)} />
      }
    } catch {
      // ignore
    }

    return (
      <>
        <NormalItem search={search} onClick={() => setOpen(false)} />
        <HashtagItem search={search} onClick={() => setOpen(false)} />
        {!!normalizedUrl && <RelayItem url={normalizedUrl} onClick={() => setOpen(false)} />}
        {profiles.map((profile) => (
          <ProfileItem key={profile.pubkey} profile={profile} onClick={() => setOpen(false)} />
        ))}
        {profiles.length >= 10 && (
          <SecondaryPageLink to={toProfileList({ search })} onClick={() => setOpen(false)}>
            <CommandItem value="show-more" onClick={() => setOpen(false)} className="text-center">
              <div className="font-semibold">{t('Show more...')}</div>
            </CommandItem>
          </SecondaryPageLink>
        )}
      </>
    )
  }, [input, debouncedInput, profiles, setOpen])

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedInput(input)
    }, 500)

    return () => {
      clearTimeout(handler)
    }
  }, [input])

  return (
    <CommandDialog open={open} onOpenChange={setOpen} classNames={{ content: 'max-sm:top-0' }}>
      <CommandInput value={input} onValueChange={setInput} />
      <CommandList scrollAreaClassName="max-h-[80vh]">{list}</CommandList>
    </CommandDialog>
  )
}

function NormalItem({ search, onClick }: { search: string; onClick?: () => void }) {
  return (
    <SecondaryPageLink to={toNoteList({ search })} onClick={onClick}>
      <CommandItem value={`search-${search}`}>
        <Notebook className="text-muted-foreground" />
        <div className="font-semibold truncate">{search}</div>
      </CommandItem>
    </SecondaryPageLink>
  )
}

function HashtagItem({ search, onClick }: { search: string; onClick?: () => void }) {
  const hashtag = search.match(/[\p{L}\p{N}\p{M}]+/u)?.[0].toLowerCase()
  return (
    <SecondaryPageLink to={toNoteList({ hashtag })} onClick={onClick}>
      <CommandItem value={`hashtag-${hashtag}`}>
        <Hash className="text-muted-foreground" />
        <div className="font-semibold">{hashtag}</div>
      </CommandItem>
    </SecondaryPageLink>
  )
}

function NoteItem({ id, onClick }: { id: string; onClick?: () => void }) {
  return (
    <SecondaryPageLink to={toNote(id)} onClick={onClick}>
      <CommandItem value={`note-id-${id}`}>
        <Notebook className="text-muted-foreground" />
        <div className="font-semibold truncate">{id}</div>
      </CommandItem>
    </SecondaryPageLink>
  )
}

function ProfileIdItem({ id, onClick }: { id: string; onClick?: () => void }) {
  return (
    <SecondaryPageLink to={toProfile(id)} onClick={onClick}>
      <CommandItem value={`profile-id-${id}`}>
        <UserRound className="text-muted-foreground" />
        <div className="font-semibold truncate">{id}</div>
      </CommandItem>
    </SecondaryPageLink>
  )
}

function ProfileItem({ profile, onClick }: { profile: TProfile; onClick?: () => void }) {
  return (
    <SecondaryPageLink to={toProfile(profile.pubkey)} onClick={onClick}>
      <CommandItem value={`profile-${profile.pubkey}`}>
        <div className="flex gap-2 items-center pointer-events-none">
          <UserAvatar userId={profile.pubkey} className="shrink-0" />
          <div className="w-full overflow-hidden">
            <Username
              userId={profile.pubkey}
              className="font-semibold truncate max-w-full w-fit"
              skeletonClassName="h-4"
            />
            <Nip05 pubkey={profile.pubkey} />
          </div>
        </div>
      </CommandItem>
    </SecondaryPageLink>
  )
}

function RelayItem({ url, onClick }: { url: string; onClick?: () => void }) {
  return (
    <SecondaryPageLink to={toRelay(url)} onClick={onClick}>
      <CommandItem value={`relay-${url}`}>
        <Server className="text-muted-foreground" />
        <div className="font-semibold truncate">{url}</div>
      </CommandItem>
    </SecondaryPageLink>
  )
}
