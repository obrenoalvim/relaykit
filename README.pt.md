# RelayKit

[![CI](https://github.com/obrenoalvim/relaykit/actions/workflows/ci.yml/badge.svg)](https://github.com/obrenoalvim/relaykit/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[🇺🇸 Read in English](README.md)

Um demo funcional de microsserviços. Um gateway repassa texto pra três
serviços especialistas, agrega as respostas e degrada com elegância quando um
deles cai. Um dashboard mostra o pipeline ao vivo: qual nó está de pé, qual
circuit breaker abriu, o que cada especialista devolveu.

## O que faz

Envie um parágrafo e o gateway distribui a requisição em paralelo pra três
serviços independentes:

- **stats-service** conta palavras, frases e sílabas, e calcula a
  legibilidade com a fórmula Flesch Reading Ease.
- **lang-service** detecta o idioma por frequência de stopwords, cobrindo
  inglês, português, espanhol, francês e alemão.
- **keyword-service** ranqueia termos por frequência depois de remover
  stopwords.

O gateway chama os três em paralelo, espera com timeout, tenta de novo uma
vez em caso de falha, e abre um circuit breaker por serviço depois de falhas
repetidas. Se um especialista fica inacessível, a resposta ainda volta com os
outros dois resultados preenchidos e o que falhou marcado como indisponível.
O status HTTP reflete isso: `200` quando todos os especialistas respondem,
`207` quando um ou mais não respondem.

## Arquitetura

```
frontend (3000)
   |
   v
gateway (4000)  -- timeout, retry e circuit breaker por servico --
   |-- stats-service   (4001)   contagem de palavras/frases, score Flesch
   |-- lang-service    (4002)   deteccao de idioma por frequencia de stopwords
   |-- keyword-service (4003)   ranking de palavras-chave por frequencia
```

Cada especialista é um app Express pequeno com duas rotas: `POST /analyze` e
`GET /health`. O gateway não guarda regra de negócio nenhuma; ele só roteia,
agrega e se protege de especialistas lentos ou mortos.

## Como rodar

Você precisa do Docker.

```bash
docker compose up --build
```

Abra `http://localhost:3000`. O gateway escuta na porta `4000`, os
especialistas de `4001` a `4003`.

Pra ver a degradação em ação, pare um especialista com a stack rodando:

```bash
docker compose stop lang-service
```

Envie o texto de novo. O card de idioma mostra "unavailable" enquanto stats e
keywords continuam funcionando.

## Desenvolvimento local sem Docker

```bash
npm install
npm run dev:gateway    # terminal 1
npm run dev:stats      # terminal 2
npm run dev:lang       # terminal 3
npm run dev:keyword    # terminal 4
npm run dev:frontend   # terminal 5
```

O frontend lê a URL do gateway na variável `NEXT_PUBLIC_GATEWAY_URL` (padrão
`http://localhost:4000`).

## API

**POST /analyze**

```json
{ "text": "seu paragrafo aqui" }
```

Retorna:

```json
{
  "status": "complete",
  "results": {
    "stats": { "status": "ok", "data": { "words": 12, "sentences": 1, "...": "..." } },
    "language": { "status": "ok", "data": { "language": "en", "confidence": "high" } },
    "keywords": { "status": "ok", "data": { "keywords": [{ "term": "example", "count": 2 }] } }
  }
}
```

Quando um especialista falha, a entrada dele vira
`{ "status": "unavailable", "reason": "circuit_open" }` (ou a mensagem de
erro original) e o `status` no topo muda pra `"degraded"`.

**GET /health**

Retorna o status do próprio gateway mais o alcance de cada especialista e o
estado do circuit breaker (`closed`, `open`, `half-open`).

## Testes

A bateria de testes roda em três níveis.

```bash
npm run test:unit          # logica pura + rotas HTTP, por servico, rede mockada
npm run test:integration   # gateway + servidores reais dos especialistas, HTTP real, sem Docker
npm test                   # os dois acima
```

O CI adiciona um quarto nível: builda todas as imagens Docker, sobe a stack
inteira com `docker compose up`, bate no gateway real via HTTP, para o
`lang-service` no meio pra confirmar o caminho de degradação `207`, e sobe
ele de novo. Veja `.github/workflows/ci.yml`.

Os testes unitários cobrem a máquina de estados do circuit breaker
diretamente (fechado, aberto, meio-aberto, recuperação) com um relógio
injetável, então os testes rodam em milissegundos em vez de esperar timers
reais.

## Estrutura do projeto

```
services/
  gateway/           gateway de API: circuit breaker, retry, timeout, agregacao
  stats-service/      estatisticas de texto e legibilidade Flesch
  lang-service/       deteccao de idioma por stopwords
  keyword-service/    extracao de palavras-chave por frequencia
frontend/            dashboard Next.js com diagrama de pipeline ao vivo
tests/integration/   testes cross-service contra servidores HTTP reais
docker-compose.yml   orquestra os cinco containers com healthchecks
```

## Decisões de design

O circuit breaker e a lógica de retry foram escritos à mão em vez de vir de
uma biblioteca. Os dois são pequenos, e escrevê-los deixa o comportamento de
resiliência algo que dá pra ler num arquivo só
(`services/gateway/src/circuitBreaker.ts`) em vez de algo que você configura
pelas opções de uma dependência.

A detecção de idioma usa frequência de stopwords em vez de um modelo
estatístico. Ela só precisa distinguir cinco idiomas pra um demo, e uma
heurística sem dependência externa é determinística, rápida de testar e não
carrega nenhum arquivo de dados externo.

## Licença

MIT. Veja [LICENSE](LICENSE).
