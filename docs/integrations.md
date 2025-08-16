# Integrações Externas

## 🔗 Visão Geral das Integrações

O WhatsApp Meme Downloader interage com diversos serviços externos e APIs para fornecer sua funcionalidade principal. Esta seção documenta todas as integrações externas, suas finalidades e dependências.

## 📱 WhatsApp Web API

### **whatsapp-web.js**
- **Finalidade**: Interface principal com o WhatsApp Web
- **Versão**: ^1.26.0
- **Tipo**: Biblioteca JavaScript não oficial
- **Dependências do módulo**: 
  - Bot WhatsApp (`src/bot/main.js`)
  - Criação de mídia (`src/bot/create_video_media.js`)

#### Funcionalidades Utilizadas:
- Autenticação via QR Code
- Recepção e envio de mensagens
- Upload de arquivos de mídia
- Gestão de sessão persistente

#### Configurações Importantes:
```javascript
webVersionCache: {
  type: 'remote',
  // Use a specific commit hash to avoid supply chain risks. Example commit hash below:
  remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/6e2b1c2a7e2e3b1e2c3d4f5a6b7c8d9e0f1a2b3c/html/2.2412.54.html'
  // For maximum security, consider downloading this file and referencing a local copy instead.
}
```

### **Riscos e Mitigações**:
- ⚠️ **Risco**: API não oficial, sujeita a quebras
- ✅ **Mitigação**: Versionamento fixo, monitoramento de atualizações

---

## 🌐 Serviços de Web Scraping

### **SaveVid.net**
- **Finalidade**: Intermediário para download de vídeos do Instagram
- **URL Base**: `https://savevid.net/en`
- **Dependências do módulo**: 
  - Download Scraper (`src/consumer/download_scraper.js`)

#### Fluxo de Integração:
1. Submissão de URL do Instagram
2. Processamento pelo serviço
3. Extração de links diretos de download
4. Download via requisições HTTP

#### Limitações:
- Dependente de disponibilidade do serviço
- Sujeito a mudanças na interface
- Rate limiting potencial

### **Instagram (Indireto)**
- **Finalidade**: Fonte original dos vídeos
- **Integração**: Via SaveVid.net (não direta)
- **Formatos Suportados**: Posts (/p/), Reels (/reel/, /reels/)

---

## 🐰 Sistema de Message Broker

### **RabbitMQ**
- **Finalidade**: Gerenciamento de filas de processamento
- **Versão**: 3-management (Docker)
- **Configuração**: `rabbitmq:5672` (interno), `localhost:15672` (management)
- **Dependências do módulo**:
  - Todos os consumers (`src/consumer/`)
  - Enqueue job (`src/bot/enqueue_job.js`)
  - Todos os workers (`src/workers/`)

#### Filas Utilizadas:
- `download_queue`: Jobs de download
- `cutter_queue`: Jobs de segmentação
- `preview_queue`: Jobs de preview
- `*_dlq`: Dead Letter Queues para retry

#### Configuração de Conexão:
```javascript
amqp.connect('amqp://guest:guest@rabbitmq:5672/')
```

---

## 🎭 Web Scraping e Automação

### **Puppeteer**
- **Finalidade**: Automação de browser para web scraping
- **Versão**: ^24.2.0
- **Browser**: Firefox (configurado via executablePath)
- **Dependências do módulo**:
  - Download Scraper (`src/consumer/download_scraper.js`)

#### Configurações:
```javascript
puppeteer.launch({
  browser: 'firefox',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  executablePath: '/usr/bin/firefox'
})
```

### **Axios**
- **Finalidade**: Requisições HTTP para download de arquivos
- **Versão**: ^1.7.9
- **Uso**: Download de vídeos após extração de URLs
- **Configuração**: `responseType: 'arraybuffer'` para arquivos binários

---

## 🎬 Processamento de Mídia

### **FFmpeg**
- **Finalidade**: Processamento e segmentação de vídeos
- **Instalação**: Via Dockerfile (`apt-get install -y ffmpeg`)
- **Dependências do módulo**:
  - Video Segmenter (`src/consumer/segment_video.js`)
  - Video Preview (`src/consumer/video_to_preview.js`)

#### Comandos Utilizados:
- **FFprobe**: Obtenção de duração de vídeo
- **FFmpeg**: Segmentação em partes de 30 segundos

```bash
# Obter duração
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 {input}

# Segmentar vídeo
ffmpeg -ss {startTime} -i {input} -t {duration} -c copy {output}
```

---

## 🐳 Infraestrutura e Deploy

### **Docker Hub**
- **Finalidade**: Imagens base para containers
- **Imagens Utilizadas**:
  - `node:latest`: Runtime da aplicação
  - `rabbitmq:3-management`: Message broker

### **Google Chrome/Firefox**
- **Finalidade**: Browsers headless para Puppeteer
- **Instalação**: Via apt-get no Dockerfile
- **Configuração**: Paths específicos para execução

---

## 📦 Dependências de Desenvolvimento

### **Node.js Ecosystem**
- **qrcode-terminal**: Exibição de QR codes no terminal
- **amqplib**: Cliente RabbitMQ para Node.js
- **prettier**: Formatação de código

---

## 🔐 Considerações de Segurança

### **Credenciais e Autenticação**
- WhatsApp: Autenticação via QR code, sessão persistida localmente
- RabbitMQ: **⚠️ Atenção:** O sistema **não utiliza** as credenciais padrão (`guest`/`guest`). É obrigatório configurar credenciais seguras e exclusivas para o RabbitMQ em todos os ambientes. O uso das credenciais padrão é bloqueado pelo código e resultará em erro de conexão.
- External APIs: Nenhuma autenticação específica requerida

### **Rate Limiting e Throttling**
- **SaveVid.net**: Sem controle específico implementado
- **Instagram**: Limitações indiretas via SaveVid.net
- **WhatsApp**: Limitações impostas pela plataforma

### **Dados Sensíveis**
- Sessões WhatsApp armazenadas em `.wwebjs_auth/`
- Vídeos temporários em `./videos/`
- Nenhum dado pessoal persistido

---

## 🔄 Fluxo de Integração Completo

```mermaid
sequenceDiagram
    participant U as Usuário
    participant WA as WhatsApp Web
    participant Bot as WhatsApp Bot
    participant RMQ as RabbitMQ
    participant Scraper as Download Scraper
    participant SV as SaveVid.net
    participant IG as Instagram
    participant FFmpeg as FFmpeg
    
    U->>WA: !download {instagram_url}
    WA->>Bot: Recebe comando
    Bot->>RMQ: Enfileira job de download
    RMQ->>Scraper: Consome job
    Scraper->>SV: Submete URL Instagram
    SV->>IG: Extrai vídeo
    SV-->>Scraper: Retorna link direto
    Scraper->>Scraper: Download via Axios
    Scraper->>RMQ: Job de segmentação
    RMQ->>FFmpeg: Processa vídeo
    FFmpeg-->>Bot: Vídeo processado
    Bot->>WA: Envia vídeo
    WA->>U: Recebe vídeo
```

## ⚡ Monitoramento e Observabilidade

### **Logs de Integração**
- Conexões RabbitMQ
- Status de download de vídeos
- Erros de scraping
- Falhas de processamento de vídeo

### **Health Checks Sugeridos**
- Conectividade com RabbitMQ
- Disponibilidade do SaveVid.net
- Status do container WhatsApp
- Espaço em disco para vídeos