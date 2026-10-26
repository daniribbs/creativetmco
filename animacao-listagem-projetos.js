document.addEventListener("DOMContentLoaded", function() {
    const images = document.querySelectorAll('.container-imagens-projetos .img-projeto');
    const links = document.querySelectorAll('.container-projetos .link-block');
  
    if (!images.length || !links.length) return;
  
    // Ativa a primeira imagem e o primeiro link por padrão ao carregar
    images[0].classList.add('is-active');
  
    links.forEach((link, index) => {
      link.addEventListener('mouseenter', () => {
        // Remove a classe ativa de todas as imagens
        images.forEach(img => img.classList.remove('is-active'));
  
        // Adiciona a classe ativa apenas na imagem correspondente ao índice do link
        if (images[index]) {
          images[index].classList.add('is-active');
        }
      });
    });
  });