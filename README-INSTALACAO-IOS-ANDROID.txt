ESCALA 24/48 PREMIUM - iOS, Android, Light/Dark e seleção múltipla de equipes

ALTERAÇÕES INCLUÍDAS
1. Suporte PWA para iOS e Android
   - manifest.json atualizado.
   - service-worker.js atualizado com cache offline.
   - apple-touch-icon.png adicionado para iPhone/iPad.
   - metas Apple e mobile adicionadas no index.html.
   - aviso de instalação específico para iOS, Android e desktop.

2. Instalação no iOS
   - Abrir o site pelo Safari.
   - Tocar em Compartilhar.
   - Escolher Adicionar à Tela de Início.
   - Confirmar em Adicionar.

3. Instalação no Android
   - Abrir o site pelo Chrome ou Edge.
   - Quando aparecer o aviso, tocar em Instalar.
   - Se o aviso não aparecer, abrir o menu do navegador e escolher Instalar app ou Adicionar à tela inicial.

4. Seleção de equipes
   - Agora é possível selecionar Equipe A, Equipe B e/ou Equipe C.
   - O sistema permite 1, 2 ou 3 equipes ao mesmo tempo.
   - Não permite deixar todas desmarcadas.
   - As equipes não selecionadas ficam esmaecidas no calendário.
   - A seleção fica salva no navegador pelo localStorage.

5. Modo claro e escuro
   - Botão de alternância adicionado no topo.
   - O sistema inicia conforme a preferência do dispositivo.
   - A escolha manual fica salva no navegador pelo localStorage.

OBSERVAÇÕES IMPORTANTES
- Para instalar como app no celular, publique em um endereço acessível por HTTP/HTTPS.
- Em produção, prefira HTTPS.
- Abrir direto por arquivo local file:// pode não permitir service worker nem instalação correta como PWA.
- Não precisa de npm, build, Vite ou servidor Node.
- É um projeto estático: basta hospedar os arquivos.


ATUALIZAÇÃO APMPMSP
----------------
- O logo da APMPMSP foi aplicado como ícone de instalação do app.
- Foram gerados favicon, Apple Touch Icon, ícones Android 192x192/512x512 e ícones maskable.
- O tema visual foi ajustado para as cores da APMPMSP: preto e amarelo.
- O modo claro e o modo escuro continuam disponíveis pelo botão Tema.
