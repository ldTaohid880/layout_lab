/** Mark the body while a pointer drag is in progress so the preview iframe ignores the pointer. */
export function setDragging(active: boolean): void {
  if (active) document.body.setAttribute('data-dragging', '')
  else document.body.removeAttribute('data-dragging')
}
