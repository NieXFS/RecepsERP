export type HelpCategory =
  | "Primeiros passos"
  | "Agenda e atendimentos"
  | "Equipe e comissões"
  | "Financeiro"
  | "Cobrança e plano"
  | "Atendente IA / WhatsApp";

export type HelpArticle = {
  slug: string;
  category: HelpCategory;
  question: string;
  answerMarkdown: string;
  updatedAt: string;
  relatedSlugs: string[];
  tags: string[];
};

function article(input: HelpArticle): HelpArticle {
  return input;
}

export const helpArticles = [
  article({
    slug: "como-configurar-minha-conta-pela-primeira-vez",
    category: "Primeiros passos",
    question: "Como configurar minha conta pela primeira vez?",
    updatedAt: "2026-04-16",
    tags: ["setup", "bem-vindo", "primeiro acesso", "cadastro"],
    relatedSlugs: ["como-cadastrar-meu-primeiro-servico", "como-adicionar-outro-profissional-na-equipe"],
    answerMarkdown: `O primeiro acesso ao Receps começa na tela **/bem-vindo**. Ali você informa o segmento do seu negócio, cadastra os primeiros serviços, define o profissional principal e revisa o horário de atendimento. Essa sequência já deixa a conta pronta para operar de verdade, sem precisar entrar em várias telas soltas logo de cara.

Se você já sabe quais serviços oferece, vale preencher com calma porque essas informações influenciam agenda, financeiro, comissões e, no plano com IA, também ajudam a Ana a responder com mais contexto. O objetivo do wizard não é travar você. É encurtar o caminho até o primeiro resultado útil dentro do sistema.

Depois de concluir o setup, o Receps libera o dashboard e você pode ajustar detalhes em **Configurações**, **Serviços**, **Profissionais** e **Agenda**. Se algo ficar para depois, tudo pode ser refinado com a conta já ativa.`,
  }),
  article({
    slug: "o-que-e-o-trial-de-7-dias-e-como-funciona",
    category: "Primeiros passos",
    question: "O que é o trial de 7 dias e como funciona?",
    updatedAt: "2026-04-16",
    tags: ["trial", "7 dias", "teste", "assinatura"],
    relatedSlugs: ["quando-preciso-adicionar-um-cartao-de-credito", "como-cancelar-minha-assinatura"],
    answerMarkdown: `O trial de 7 dias é o período de teste do Receps. Você cria a conta, entra no sistema, faz o setup inicial e pode usar os recursos do plano escolhido sem cobrança imediata. A ideia é permitir que o seu negócio valide rotina, usabilidade e aderência antes da primeira cobrança.

Durante o trial, o sistema mostra avisos sobre quantos dias faltam para o fim do período. Esses avisos ficam mais visíveis nos últimos dias para evitar surpresa. Se você adicionar uma forma de pagamento válida dentro do prazo, a assinatura continua normalmente ao fim do teste.

Se o trial terminar sem cartão cadastrado, o acesso pode ser bloqueado até que a assinatura seja regularizada. Isso não significa perder a conta automaticamente, mas o uso do ERP passa a depender da reativação da cobrança.`,
  }),
  article({
    slug: "quando-preciso-adicionar-um-cartao-de-credito",
    category: "Primeiros passos",
    question: "Quando preciso adicionar um cartão de crédito?",
    updatedAt: "2026-04-16",
    tags: ["cartao", "billing portal", "trial", "pagamento"],
    relatedSlugs: ["o-que-e-o-trial-de-7-dias-e-como-funciona", "como-atualizar-meu-cartao-de-credito"],
    answerMarkdown: `Você não precisa adicionar cartão no momento do cadastro. O Receps libera o trial primeiro para reduzir atrito e permitir que você configure a conta antes de decidir seguir com a cobrança recorrente.

O melhor momento para cadastrar o cartão é ainda durante o trial, especialmente quando o banner avisar que faltam poucos dias para a primeira cobrança. Isso evita bloqueio de acesso e garante que a assinatura transicione de forma mais suave para o status ativo.

O cadastro do cartão acontece pelo **Billing Portal da Stripe**, que é a ferramenta hospedada usada pelo Receps para gerenciar pagamento, método de cobrança e cancelamento. O Receps não armazena o número completo do seu cartão.`,
  }),
  article({
    slug: "posso-testar-sem-cnpj",
    category: "Primeiros passos",
    question: "Posso testar sem CNPJ?",
    updatedAt: "2026-04-16",
    tags: ["cnpj", "cadastro", "trial", "validacao"],
    relatedSlugs: ["como-configurar-minha-conta-pela-primeira-vez", "como-cadastrar-meu-primeiro-servico"],
    answerMarkdown: `Não. Hoje o CNPJ é obrigatório no cadastro do Receps. Essa exigência existe para filtrar testes mais qualificados, reduzir conta curiosa sem operação real e preparar a base para recursos fiscais e financeiros.

Além de servir como dado de identificação do negócio, o CNPJ também ajuda a Receps a manter consistência em cobrança, dados cadastrais e futuras integrações ligadas à operação da empresa. Por isso ele é validado já no início do signup.

Se você estiver em fase de abertura e ainda não tiver o CNPJ final, o melhor caminho é falar com o time da Receps pelo WhatsApp para entender se existe um fluxo adequado ao seu momento.`,
  }),
  article({
    slug: "como-cadastrar-meu-primeiro-servico",
    category: "Primeiros passos",
    question: "Como cadastrar meu primeiro serviço?",
    updatedAt: "2026-04-16",
    tags: ["servicos", "setup", "catalogo", "primeiro acesso"],
    relatedSlugs: ["como-configurar-minha-conta-pela-primeira-vez", "como-criar-um-agendamento"],
    answerMarkdown: `O primeiro cadastro de serviço normalmente acontece no wizard **/bem-vindo**, logo após a escolha do segmento do negócio. Você informa nome, duração e valor para começar com um catálogo mínimo funcional.

Depois do setup, os serviços também podem ser gerenciados na tela **Serviços**. Lá você pode editar valores, ajustar duração, descrever o procedimento e expandir o catálogo aos poucos, sem precisar cadastrar tudo no primeiro dia.

Se você atende muitos tipos de serviço, comece pelo essencial: o que mais agenda, o que gera caixa mais rápido e o que precisa entrar logo na rotina. Isso já é suficiente para usar agenda, financeiro e setup inicial com consistência.`,
  }),
  article({
    slug: "como-criar-um-agendamento",
    category: "Agenda e atendimentos",
    question: "Como criar um agendamento?",
    updatedAt: "2026-04-16",
    tags: ["agenda", "agendamento", "cliente", "horario"],
    relatedSlugs: ["como-reagendar-ou-cancelar-um-atendimento", "como-bloquear-horarios-folga-almoco-feriado"],
    answerMarkdown: `Na agenda do Receps, você escolhe o cliente, o profissional, os serviços e o horário desejado. O sistema usa essas informações para calcular duração, verificar conflito e registrar o atendimento com o valor correto.

Se o cliente ainda não estiver cadastrado, o próprio fluxo de agendamento permite criar esse cadastro antes de concluir a marcação. Isso evita retrabalho e mantém histórico, recorrência e faturamento vinculados desde o começo.

No plano com Atendente IA, parte desse processo também pode vir pronta do WhatsApp. Quando a Ana agenda corretamente, o horário já chega no ERP com cliente, profissional e serviço preenchidos conforme a configuração existente.`,
  }),
  article({
    slug: "como-bloquear-horarios-folga-almoco-feriado",
    category: "Agenda e atendimentos",
    question: "Como bloquear horários (folga, almoço, feriado)?",
    updatedAt: "2026-04-16",
    tags: ["agenda", "bloqueio", "folga", "feriado"],
    relatedSlugs: ["como-criar-um-agendamento", "como-reagendar-ou-cancelar-um-atendimento"],
    answerMarkdown: `Os bloqueios servem para impedir que um período apareça como disponível para novos atendimentos. Isso é útil para almoço, reunião, folga, feriado, manutenção de sala ou qualquer outro intervalo em que a operação não pode receber agenda.

O ideal é fazer esses bloqueios antes que o dia fique cheio. Assim o sistema já trabalha em cima de disponibilidade real, e você evita encaixes manuais que depois precisam ser corrigidos no atendimento.

Se o seu negócio trabalha com horários diferentes por profissional, o ajuste também precisa respeitar essa lógica. O Receps foi desenhado justamente para separar agenda do negócio e agenda da equipe quando necessário.`,
  }),
  article({
    slug: "como-reagendar-ou-cancelar-um-atendimento",
    category: "Agenda e atendimentos",
    question: "Como reagendar ou cancelar um atendimento?",
    updatedAt: "2026-04-16",
    tags: ["reagendar", "cancelar", "atendimento", "agenda"],
    relatedSlugs: ["como-criar-um-agendamento", "como-funciona-o-lembrete-pro-cliente"],
    answerMarkdown: `Dentro do registro do agendamento, você pode alterar horário, data ou status conforme o caso. O importante é evitar apagar e recriar atendimento sem necessidade, porque isso quebra histórico e pode confundir relatórios futuros.

Quando um atendimento é cancelado, vale registrar o motivo sempre que fizer sentido. Isso ajuda a entender faltas recorrentes, reagendamentos excessivos e comportamentos que impactam a ocupação da agenda ao longo do tempo.

Se o atendimento já gerou movimentação financeira ou comissão, o ideal é revisar também esses efeitos no fluxo operacional. O Receps organiza isso melhor quando a mudança de status é feita pelo caminho previsto, e não em ajustes paralelos.`,
  }),
  article({
    slug: "o-cliente-pode-agendar-sozinho",
    category: "Agenda e atendimentos",
    question: "O cliente pode agendar sozinho?",
    updatedAt: "2026-04-16",
    tags: ["autoagendamento", "cliente", "whatsapp", "ana"],
    relatedSlugs: ["como-funciona-o-lembrete-pro-cliente", "como-conectar-meu-whatsapp-na-ana"],
    answerMarkdown: `Sim, dependendo do plano e da configuração do atendimento. No fluxo com Atendente IA, o cliente conversa pelo WhatsApp e a Ana oferece horários com base no que realmente está livre na agenda.

Na prática, isso reduz a dependência de alguém parar para responder mensagem manualmente. O cliente continua usando o canal que já conhece, enquanto o Receps recebe o agendamento como operação estruturada dentro do sistema.

Para funcionar bem, os serviços, profissionais e horários precisam estar corretamente configurados. O autoagendamento não substitui uma base organizada. Ele aproveita essa base para escalar atendimento sem perder controle.`,
  }),
  article({
    slug: "como-funciona-o-lembrete-pro-cliente",
    category: "Agenda e atendimentos",
    question: "Como funciona o lembrete pro cliente?",
    updatedAt: "2026-04-16",
    tags: ["lembrete", "cliente", "whatsapp", "agenda"],
    relatedSlugs: ["o-cliente-pode-agendar-sozinho", "como-reagendar-ou-cancelar-um-atendimento"],
    answerMarkdown: `O lembrete existe para reduzir ausência, confirmação em cima da hora e agenda perdida. Dependendo do fluxo ativo no seu plano, ele pode ser feito de forma operacional pela equipe ou automatizado por canais conectados ao atendimento.

O papel do lembrete é simples: relembrar o cliente do compromisso e diminuir o risco de buracos na agenda. Em operações que vivem com encaixe apertado, isso faz diferença real na ocupação do dia.

Mesmo quando o lembrete é automatizado, a qualidade dele depende da base. Horário, cliente, profissional e serviço precisam estar corretos para a comunicação sair de forma coerente.`,
  }),
  article({
    slug: "como-adicionar-outro-profissional-na-equipe",
    category: "Equipe e comissões",
    question: "Como adicionar outro profissional na equipe?",
    updatedAt: "2026-04-16",
    tags: ["profissionais", "equipe", "usuarios", "cadastro"],
    relatedSlugs: ["como-funciona-o-calculo-de-comissoes", "como-dar-acesso-restrito-recepcionista-vs-admin"],
    answerMarkdown: `Depois do primeiro profissional criado no setup, novos membros podem ser cadastrados na área de **Profissionais** ou nas configurações da equipe. Cada pessoa pode ter especialidade, comissão e, quando aplicável, permissões específicas dentro da operação.

Separar corretamente quem atende, quem administra e quem só apoia a agenda deixa a rotina mais segura. Isso evita acesso indevido a financeiro, dados sensíveis ou configurações críticas do negócio.

Se a pessoa precisa apenas aparecer na agenda, o cadastro deve refletir isso. Se também vai usar o sistema com login próprio, é importante revisar cargo e permissões antes de liberar acesso.`,
  }),
  article({
    slug: "como-funciona-o-calculo-de-comissoes",
    category: "Equipe e comissões",
    question: "Como funciona o cálculo de comissões?",
    updatedAt: "2026-04-16",
    tags: ["comissoes", "profissionais", "financeiro", "repasse"],
    relatedSlugs: ["como-adicionar-outro-profissional-na-equipe", "como-abrir-e-fechar-caixa"],
    answerMarkdown: `O Receps calcula comissão com base nas regras configuradas para cada profissional e no que efetivamente foi realizado no atendimento. A lógica considera os registros do ERP para reduzir planilha paralela e conta manual no fim do mês.

Para esse cálculo ficar confiável, é importante manter atendimento, serviço e fechamento financeiro consistentes. Quanto mais fiel estiver a operação dentro do sistema, menos ajuste manual será necessário na hora de pagar a equipe.

O ganho principal não é só velocidade. É previsibilidade. Você consegue conferir o que está sendo pago, por quê e em qual atendimento aquilo se apoia, sem depender da memória da recepção ou de anotações espalhadas.`,
  }),
  article({
    slug: "como-dar-acesso-restrito-recepcionista-vs-admin",
    category: "Equipe e comissões",
    question: "Como dar acesso restrito (recepcionista vs admin)?",
    updatedAt: "2026-04-16",
    tags: ["permissoes", "acesso", "recepcionista", "admin"],
    relatedSlugs: ["como-adicionar-outro-profissional-na-equipe", "como-funciona-o-calculo-de-comissoes"],
    answerMarkdown: `O Receps trabalha com perfis e permissões para separar o que cada usuário pode ver e fazer. Em geral, o administrador concentra acesso total, enquanto funções como recepção e profissional têm visão mais limitada.

Essa separação é importante para proteger financeiro, configurações e dados sensíveis do negócio. Ao mesmo tempo, ela mantém a operação leve para quem só precisa trabalhar agenda, cadastro e rotina básica do atendimento.

Antes de liberar um usuário novo, revise o papel dessa pessoa no dia a dia. Permissão não deve ser concedida por conveniência. Deve refletir a função real que ela exerce dentro da empresa.`,
  }),
  article({
    slug: "como-abrir-e-fechar-caixa",
    category: "Financeiro",
    question: "Como abrir e fechar caixa?",
    updatedAt: "2026-04-16",
    tags: ["caixa", "financeiro", "fechamento", "movimentacao"],
    relatedSlugs: ["como-registrar-uma-despesa", "de-onde-vem-o-numero-de-faturamento-do-dashboard"],
    answerMarkdown: `Abrir e fechar caixa no Receps serve para organizar o dia financeiro da operação. Isso inclui entradas, saídas, conferência de pagamentos e visão do que realmente aconteceu naquele período.

Quando esse fluxo é seguido corretamente, o fechamento deixa de depender de planilha, papel ou reconciliação feita no fim da noite. O sistema passa a refletir melhor a rotina do dia e reduz diferença entre operação e financeiro.

Se sua equipe ainda está começando, vale padronizar quem abre, quem fecha e em que momento isso é feito. O processo só ganha velocidade quando existe disciplina mínima no uso diário.`,
  }),
  article({
    slug: "como-registrar-uma-despesa",
    category: "Financeiro",
    question: "Como registrar uma despesa?",
    updatedAt: "2026-04-16",
    tags: ["despesa", "financeiro", "caixa", "custos"],
    relatedSlugs: ["como-abrir-e-fechar-caixa", "de-onde-vem-o-numero-de-faturamento-do-dashboard"],
    answerMarkdown: `Despesas devem ser registradas na área financeira para que o resultado do negócio fique coerente. Isso inclui custos recorrentes, compras avulsas, pagamento de fornecedor e saídas que impactam o caixa.

O erro mais comum é lançar só o que entrou e esquecer o que saiu. Quando isso acontece, o dashboard parece bonito, mas não representa margem real. O Receps ajuda justamente a trazer visibilidade para os dois lados.

Se possível, padronize categorias de despesa desde cedo. Isso melhora a leitura do mês, simplifica relatório e ajuda a responder perguntas simples, como onde o negócio está gastando demais.`,
  }),
  article({
    slug: "de-onde-vem-o-numero-de-faturamento-do-dashboard",
    category: "Financeiro",
    question: "De onde vem o número de faturamento do dashboard?",
    updatedAt: "2026-04-16",
    tags: ["dashboard", "faturamento", "financeiro", "relatorios"],
    relatedSlugs: ["como-abrir-e-fechar-caixa", "como-registrar-uma-despesa"],
    answerMarkdown: `O faturamento mostrado no dashboard é derivado dos lançamentos e atendimentos registrados dentro do Receps. Em outras palavras, ele depende da qualidade com que agenda, checkout e financeiro estão sendo usados no dia a dia.

Se algo não foi lançado, foi cancelado fora do fluxo ou ficou em planilha paralela, esse valor pode não aparecer como você espera. O dashboard não adivinha operação. Ele consolida o que realmente entrou no sistema.

Por isso, a melhor forma de confiar no número é manter a rotina disciplinada. Quando equipe e financeiro alimentam o mesmo lugar, o dashboard vira uma ferramenta de decisão, e não só uma tela bonita.`,
  }),
  article({
    slug: "como-mudar-de-plano",
    category: "Cobrança e plano",
    question: "Como mudar de plano?",
    updatedAt: "2026-04-16",
    tags: ["upgrade", "downgrade", "plano", "billing portal"],
    relatedSlugs: ["como-cancelar-minha-assinatura", "como-atualizar-meu-cartao-de-credito"],
    answerMarkdown: `A mudança de plano acontece pelo fluxo de cobrança disponível para a sua conta, normalmente via Billing Portal ou orientação do suporte quando o caso exige revisão operacional. O objetivo é trocar sem quebrar a rotina já em andamento.

Se você está saindo de um plano menor para o combo, por exemplo, vale garantir que os módulos novos sejam ativados com a base já organizada. Isso faz o upgrade render mais rápido e evita sensação de complexidade desnecessária.

Antes de trocar, pense no motivo real: falta recurso, falta automação, falta controle ou apenas uso parcial do que você já tem. Essa resposta ajuda a escolher melhor o plano e a priorizar implantação.`,
  }),
  article({
    slug: "como-cancelar-minha-assinatura",
    category: "Cobrança e plano",
    question: "Como cancelar minha assinatura?",
    updatedAt: "2026-04-16",
    tags: ["cancelar", "assinatura", "billing portal", "plano"],
    relatedSlugs: ["como-mudar-de-plano", "como-atualizar-meu-cartao-de-credito"],
    answerMarkdown: `O cancelamento pode ser iniciado pelo portal de cobrança quando essa opção estiver disponível para a sua assinatura. Esse é o caminho mais seguro porque registra a decisão no mesmo fluxo que gerencia pagamento, método de cobrança e ciclo do plano.

Antes de cancelar, vale revisar se o problema é realmente o plano ou se falta configuração, treinamento ou ajuste de processo. Em muitos casos, um gargalo de uso parece problema de produto, quando na prática é uma etapa mal implantada.

Se o cancelamento for mantido, confira o que acontece com seu acesso, retenção de dados e data efetiva de encerramento. Isso evita surpresas e ajuda a planejar transição ou exportação do que for necessário.`,
  }),
  article({
    slug: "como-atualizar-meu-cartao-de-credito",
    category: "Cobrança e plano",
    question: "Como atualizar meu cartão de crédito?",
    updatedAt: "2026-04-16",
    tags: ["cartao", "billing portal", "pagamento", "cobranca"],
    relatedSlugs: ["quando-preciso-adicionar-um-cartao-de-credito", "como-cancelar-minha-assinatura"],
    answerMarkdown: `A atualização do cartão é feita pelo Billing Portal da Stripe, acessado a partir do Receps. Esse portal permite adicionar, trocar ou revisar a forma de pagamento de maneira segura, sem expor dados sensíveis dentro do app.

Se houve falha de pagamento ou o trial está terminando, atualizar o cartão o quanto antes reduz risco de bloqueio. O ideal é não esperar a cobrança falhar para agir, especialmente se o sistema já estiver no centro da sua operação.

Depois da troca, vale conferir se o novo método ficou salvo como padrão. Isso garante que a próxima tentativa de cobrança use o cartão certo, sem depender de nova ação manual.`,
  }),
  article({
    slug: "como-conectar-meu-whatsapp-na-ana",
    category: "Atendente IA / WhatsApp",
    question: "Como conectar meu WhatsApp na Ana?",
    updatedAt: "2026-04-16",
    tags: ["whatsapp", "ana", "bot", "conexao"],
    relatedSlugs: ["o-cliente-pode-agendar-sozinho", "como-funciona-o-lembrete-pro-cliente"],
    answerMarkdown: `A conexão do WhatsApp com a Ana depende da configuração do canal usado pelo seu negócio. O Receps organiza a parte operacional e a base do atendimento, mas a ativação do canal precisa respeitar o cenário técnico disponível para a sua conta.

O passo mais importante antes de conectar é deixar serviços, horários, profissionais e identidade de atendimento minimamente organizados. A Ana responde melhor quando a operação já está clara dentro do sistema.

Se você quer ativar esse fluxo, o caminho mais seguro é começar pelo plano correto e falar com o time da Receps para orientar a ativação. Assim você evita uma conexão incompleta ou expectativa errada sobre o que já vai entrar no ar.`,
  }),
] satisfies HelpArticle[];

export const helpCategories: HelpCategory[] = [
  "Primeiros passos",
  "Agenda e atendimentos",
  "Equipe e comissões",
  "Financeiro",
  "Cobrança e plano",
  "Atendente IA / WhatsApp",
];

export function getHelpArticleBySlug(slug: string) {
  return helpArticles.find((article) => article.slug === slug) ?? null;
}

export function getHelpArticlesByCategory(category: HelpCategory) {
  return helpArticles.filter((article) => article.category === category);
}
