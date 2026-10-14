# Creative TMCO

Código custom (CSS e JavaScript) do site [creativetm.co](https://creativetm.co), usado junto com o Webflow.

O HTML das páginas fica no Webflow. Este repositório guarda os scripts, estilos e automações que complementam o site.

## Como usar

No Webflow, adicione um elemento **Code Embed** no final da página e aponte para os arquivos publicados no GitHub Pages:

```html
<script src="https://daniribbs.github.io/creativetmco/About/script/about.js"></script>
<link rel="stylesheet" href="https://daniribbs.github.io/creativetmco/About/css/about.css">
```

Troque o caminho no final da URL pelo arquivo que a página precisa.

Alguns scripts dependem de classes e estrutura HTML já definidas no Webflow. Se um comportamento não funcionar, confira se os seletores do JS batem com os elementos da página.

## O que tem aqui

| Arquivo / pasta | Função |
| --- | --- |
| `global.css` | Ajustes globais (formulários, selects, checkbox). |
| `home.css`, `menu.css`, `all-cases.css` | Estilos da home, menu e listagem de cases. |
| `menu.js`, `menu-act.js`, `close-menu-by-cta.js` | Menu desktop/mobile e overlays. |
| `acordeon-faq.js`, `acordeon-serv.js`, `faq-services.js` | Accordions de FAQ e serviços. |
| `phone-field.js` | Máscara e DDI do campo de telefone (+55 / +351). |
| `utm-colect.js` | Guarda UTMs e IDs de anúncio em cookie. |
| `select-case.js` | Filtro de cases. |
| `*marquee*.js`, `*gallery*.js`, `grid-cards-std.js`, `cascade-style.js` | Carrosséis, galerias e animações. |
| `About/` | CSS e JS da página Sobre. |
| `scripts/fetch-instagram.js` | Busca posts do Instagram e gera `instagram-posts.json`. |