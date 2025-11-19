//Este script será executado em todas as páginas
document.addEventListener('DOMContentLoaded', () => {
  
  //1. Encontra o rodapé
  const footer = document.querySelector('footer');
  if (!footer) return; //Não faz nada se não houver footer na página

  //2. Cria o botão "toggle"
  const toggleButton = document.createElement('button');
  toggleButton.id = 'footer-toggle';
  toggleButton.innerHTML = '&or;'; //Seta para baixo (v)
  toggleButton.title = 'Esconder rodapé';

  //--- NOVA LÓGICA ---

  //3. Verifica o estado salvo no localStorage
  const isFooterHidden = localStorage.getItem('jojoFooterHidden') === 'true';

  //4. Aplica o estado salvo IMEDIATAMENTE ao carregar a página
  if (isFooterHidden) {
    footer.classList.add('footer-hidden');
    toggleButton.innerHTML = '&and;'; //Seta para cima (^)
    toggleButton.title = 'Mostrar rodapé';
  }
  //(Se for 'false' ou 'null', não faz nada, pois o padrão é mostrar)

  //5. Adiciona o botão ao rodapé
  footer.appendChild(toggleButton);

  //6. Adiciona o evento de clique
  toggleButton.addEventListener('click', () => {
    
    //Adiciona ou remove a classe (retorna 'true' se a classe foi ADICIONADA)
    const agoraEstaEscondido = footer.classList.toggle('footer-hidden');

    //7. Muda o ícone E SALVA a preferência
    if (agoraEstaEscondido) {
      //Se está escondido
      toggleButton.innerHTML = '&and;'; //Seta para cima (^)
      toggleButton.title = 'Mostrar rodapé';
      //Salva no localStorage
      localStorage.setItem('jojoFooterHidden', 'true');
    } else {
      //Se está visível
      toggleButton.innerHTML = '&or;'; //Seta para baixo (v)
      toggleButton.title = 'Esconder rodapé';
      //Salva no localStorage
      localStorage.setItem('jojoFooterHidden', 'false');
    }
  });
});