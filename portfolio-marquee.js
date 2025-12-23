document.addEventListener("DOMContentLoaded", function() {
  document.querySelectorAll('.portfolio-list-image').forEach(track => {
    const clone = track.innerHTML;
    for (let i = 0; i < 3; i++) { // repete 3 vezes
      track.innerHTML += clone;
    }
  });
});
