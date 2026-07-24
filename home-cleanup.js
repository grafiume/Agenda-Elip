(() => {
  const removeNoteCard = noteKey => {
    const textarea = document.querySelector(`[data-note="${noteKey}"]`);
    const card = textarea?.closest('.note-card');
    if (card) card.remove();
  };

  removeNoteCard('important');
  removeNoteCard('reminder');
  removeNoteCard('weekend');
})();
