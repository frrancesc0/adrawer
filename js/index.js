document.addEventListener('DOMContentLoaded', () => {
  const toolCards = document.querySelectorAll('.tool-card');

  // Animación escalonada (staggered) de entrada
  toolCards.forEach((card, index) => {
    // 1. Estado inicial antes de aparecer
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      // 2. Ejecutamos la animación de entrada
      card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
      
      // 3. CRUCIAL: Limpiamos los estilos en línea al terminar la animación (400ms)
      // Esto permite que el CSS retome el control y el efecto :hover siga funcionando
      setTimeout(() => {
        card.style.transition = '';
        card.style.transform = '';
      }, 400); 

    }, 100 * index); // Multiplicador para el retraso en cascada
  });
});