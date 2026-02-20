/**
 * RichAttachment — an enriched attachment object that includes both the
 * original SAM.gov filename and the user-edited working name.
 *
 * When no rename has been made, `currentName === originalName` and
 * `isEdited === false`.
 */
export interface RichAttachment {
  /** SAM.gov attachment ID (e.g. "resource-0", "additionalInfo") */
  id: string
  /** Original filename from SAM.gov — immutable, never overwritten */
  originalName: string
  /** Working name — may equal originalName if no rename has occurred */
  currentName: string
  /** True when a user has renamed this attachment */
  isEdited: boolean
  /** Proxy URL for server-side streaming */
  url: string
  /** MIME type or file extension hint */
  type?: string
  /** File size in bytes */
  size?: number
  /** ISO date string when the attachment was posted to SAM.gov */
  postedDate?: string
  /** ISO date string of the most recent rename */
  editedAt?: string
  /** Display name of the user who last renamed the attachment */
  editedBy?: string
}
