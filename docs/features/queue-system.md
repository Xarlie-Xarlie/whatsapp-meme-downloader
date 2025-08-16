# Sistema de Filas

## 🔄 Visão Geral da Funcionalidade

O Sistema de Filas é o coração da arquitetura assíncrona do WhatsApp Meme Downloader, responsável por orquestrar o processamento paralelo e resiliente de tarefas através de RabbitMQ, garantindo confiabilidade e escalabilidade.

## 🏗️ Arquitetura e Posicionamento

### Posição na Arquitetura
- **Camada**: Infraestrutura/Orquestração
- **Responsabilidade**: Coordenação de processamento assíncrono
- **Dependências**: RabbitMQ, AMQP, Workers

### Módulos Relacionados
- `src/consumer/consumer.js` - Framework base de consumo
- `src/consumer/dlq_consumer.js` - Gestão de Dead Letter Queues
- `src/bot/enqueue_job.js` - Interface de enfileiramento
- `src/workers/*.js` - Workers especializados
- `src/index.js` - Coordenação e gestão de eventos

## 🎯 Propósito e Lógica de Negócio

### Propósito Principal
Garantir processamento confiável e escalável de tarefas através de filas especializadas, com recuperação automática de falhas e balanceamento de carga entre workers.

### Valor de Negócio
- ✅ **Confiabilidade**: Processamento garantido com retry automático
- ✅ **Escalabilidade**: Paralelização natural de tarefas
- ✅ **Resiliência**: Recuperação automática de falhas
- ✅ **Observabilidade**: Rastreamento de status de processamento

## 🔄 Arquitetura do Sistema de Filas

### Estrutura Completa das Filas

```mermaid
graph TD
    subgraph "Pontos de Entrada"
        A[WhatsApp Bot]
        B[Worker Events]
    end
    
    subgraph "Filas Principais"
        C[download_queue]
        D[cutter_queue]
        E[preview_queue]
    end
    
    subgraph "Dead Letter Queues"
        F[download_queue_dlq]
        G[cutter_queue_dlq]
        H[preview_queue_dlq]
    end
    
    subgraph "Workers"
        I[Download Worker]
        J[Cutter Worker]
        K[Preview Worker]
    end
    
    subgraph "Processadores"
        L[Download Scraper]
        M[Video Segmenter]
        N[Video Preview]
    end
    
    subgraph "RabbitMQ Infrastructure"
        O[(RabbitMQ Server)]
        P[AMQP Channel]
        Q[Connection Pool]
    end
    
    %% Fluxo principal
    A -->|Enqueue Job| C
    A -->|Enqueue Job| D
    A -->|Enqueue Job| E
    
    %% Consumo
    C --> I
    D --> J
    E --> K
    
    %% Processamento
    I --> L
    J --> M
    K --> N
    
    %% Falhas para DLQ
    I -.->|Falha| F
    J -.->|Falha| G
    K -.->|Falha| H
    
    %% Retry das DLQs
    F -.->|Retry| C
    G -.->|Retry| D
    H -.->|Retry| E
    
    %% Infraestrutura
    C --> O
    D --> O
    E --> O
    F --> O
    G --> O
    H --> O
    
    O --> P
    P --> Q
    
    %% Notificações
    L -.->|Resultado| B
    M -.->|Resultado| B
    N -.->|Resultado| B
    B --> A
    
    style A fill:#e1f5fe
    style O fill:#fff3e0
    style F fill:#ffebee
    style G fill:#ffebee
    style H fill:#ffebee
```

### Fluxo de Processamento Detalhado

```mermaid
sequenceDiagram
    participant Bot as WhatsApp Bot
    participant Enqueue as Enqueue Job
    participant RMQ as RabbitMQ
    participant Consumer as Consumer
    participant Worker as Worker Thread
    participant Processor as Processor
    participant DLQ as DLQ Consumer
    participant Index as Main Coordinator
    
    Bot->>Enqueue: enqueueJob(queue, payload)
    Enqueue->>RMQ: Publish message
    RMQ->>Consumer: Deliver message
    Consumer->>Processor: Execute callback
    
    alt Processamento Bem-sucedido
        Processor-->>Consumer: Resultado
        Consumer->>RMQ: ACK message
        Consumer->>Worker: Enviar evento
        Worker->>Index: postMessage(resultado)
        Index->>Bot: Processar resultado
    else Processamento com Falha
        Processor-->>Consumer: Error
        Consumer->>RMQ: Enviar para DLQ
        Consumer->>RMQ: ACK message original
        RMQ->>DLQ: Message na DLQ
        DLQ->>DLQ: Verificar retry count
        alt Retry < 5
            DLQ->>RMQ: Reenviar para fila original
        else Max retries atingido
            DLQ->>Worker: Notificar falha definitiva
            Worker->>Index: postMessage(falha)
            Index->>Bot: Processar falha
        end
    end
```

## 📋 Implementação Técnica Detalhada

### **Consumer Framework Base**
```javascript
function consumer(queueName, consumeCallback, eventCallback) {
  amqp.connect('amqp://guest:guest@rabbitmq:5672/', function (error0, connection) {
    if (error0) throw error0;

    connection.createChannel(function (error1, channel) {
      if (error1) throw error1;

      channel.assertQueue(queueName, { durable: true });
      channel.prefetch(1); // Um job por vez por worker

      console.log(`Listening to queue '${queueName}'`);

      channel.consume(queueName, async (msg) => {
        try {
          const payload = JSON.parse(msg.content.toString());
          const result = await consumeCallback(payload);

          if (eventCallback) {
            payload.results = result;
            payload.queueName = queueName;
            eventCallback(payload);
          }

          channel.ack(msg);
        } catch (e) {
          console.error(e);
          // Enviar para DLQ
          channel.sendToQueue(`${queueName}_dlq`, msg.content, {
            persistent: true
          });
          channel.ack(msg);
        }
      }, { noAck: false });
    });
  });
}
```

### **Dead Letter Queue Management**
```javascript
function dlqConsumer(queueName, eventCallback) {
  amqp.connect('amqp://guest:guest@rabbitmq:5672/', function (error0, connection) {
    connection.createChannel(function (error1, channel) {
      channel.assertQueue(queueName, { durable: true });
      
      channel.consume(queueName, function (msg) {
        const payload = JSON.parse(msg.content.toString());
        const retryCount = payload.retryCount;

        if (retryCount < MAX_RETRIES) {
          handleRetry(channel, msg, retryCount, queueName);
        } else {
          // Falha definitiva
          if (eventCallback) {
            payload.queueName = queueName;
            eventCallback(payload);
          }
          console.log(`Maximum retry count reached for message. Rejecting.`);
          channel.reject(msg, false);
        }
      }, { noAck: false });
    });
  });
}

function handleRetry(channel, msg, retryCount, queueName) {
  const data = JSON.parse(msg.content.toString());
  data['retryCount'] = retryCount + 1;

  channel.sendToQueue(
    queueName.replace('_dlq', ''),
    Buffer.from(JSON.stringify(data)),
    { persistent: true }
  );

  console.log(`Message retried (${retryCount + 1} retries).`);
  channel.ack(msg);
}
```

### **Job Enqueuing Interface**
```javascript
function enqueueJob(queueName, payload) {
  try {
    amqp.connect('amqp://guest:guest@rabbitmq:5672/', function (error0, connection) {
      if (error0) throw error0;
      
      connection.createChannel(function (error1, channel) {
        if (error1) throw error1;

        channel.assertQueue(queueName, { durable: true });
        channel.sendToQueue(queueName, Buffer.from(JSON.stringify(payload)));

        console.log(`Enqueued Job for queue: ${queueName}`);
      });
      
      setTimeout(() => {
        connection.close();
      }, 500);
    });
  } catch (_e) {
    return `Enqueue Failed for queue: ${queueName} and payload: ${payload}.`;
  }
}
```

## 🏗️ Modelo de Domínio da Funcionalidade

### **Entidades Principais**

#### 🔄 **Job de Processamento (ProcessingJob)**
- **Propriedades**:
  - `queueName`: Nome da fila de destino
  - `payload`: Dados para processamento
  - `retryCount`: Número de tentativas (0-5)
  - `timestamp`: Momento de criação
  - `priority`: Prioridade (futuro)

#### 📨 **Mensagem AMQP (AmqpMessage)**
- **Propriedades**:
  - `content`: Conteúdo serializado (JSON)
  - `properties`: Metadados da mensagem
  - `deliveryTag`: ID único da entrega
  - `redelivered`: Flag de reentrega

#### 🚨 **Dead Letter (DeadLetter)**
- **Propriedades**:
  - `originalQueue`: Fila original
  - `failureReason`: Motivo da falha
  - `retryCount`: Tentativas realizadas
  - `lastAttempt`: Timestamp da última tentativa

### **Objetos de Valor**

#### 📊 **Status de Job (JobStatus)**
```javascript
const JobStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  RETRYING: 'retrying'
};
```

#### ⚙️ **Configuração de Fila (QueueConfig)**
```javascript
const QueueConfig = {
  durable: true,        // Persistir mensagens
  prefetch: 1,          // Um job por worker
  autoAck: false,       // ACK manual
  persistent: true      // Mensagens persistentes
};
```

### **Regras de Negócio Específicas**

#### **RN-QS001**: Gestão de Retry
| Tentativa | Ação | Delay |
|-----------|------|-------|
| 1ª - 5ª | Reprocessar automaticamente | Imediato |
| 6ª | Marcar como falha definitiva | N/A |
| Falha definitiva | Notificar sistema | N/A |

#### **RN-QS002**: Especialização de Filas
| Fila | Responsabilidade | Worker |
|------|------------------|--------|
| `download_queue` | Jobs de download | Download Worker |
| `cutter_queue` | Jobs de segmentação | Cutter Worker |
| `preview_queue` | Jobs de preview | Preview Worker |

#### **RN-QS003**: Balanceamento de Carga
```javascript
channel.prefetch(1); // Um job por worker simultaneamente
// Garantia de distribuição uniforme entre workers
```

#### **RN-QS004**: Persistência de Dados
```javascript
// Configurações de durabilidade
channel.assertQueue(queueName, { durable: true });
channel.sendToQueue(queueName, buffer, { persistent: true });
```

## 🔧 Configuração e Dependências

### **RabbitMQ Configuration**
```yaml
# docker-compose.yml
services:
  rabbitmq:
    image: rabbitmq:3-management
    hostname: rabbitmq
    ports:
      - '5672:5672'    # AMQP
      - '15672:15672'  # Management UI
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
```

### **Connection Parameters**
```javascript
const connectionString = 'amqp://guest:guest@rabbitmq:5672/';

// Configurações de conexão
const connectionOptions = {
  heartbeat: 60,
  connection_timeout: 10000,
  channelMax: 100
};
```

### **Queue Definitions**
```javascript
const QUEUE_NAMES = {
  DOWNLOAD: 'download_queue',
  CUTTER: 'cutter_queue',
  DOWNLOAD_DLQ: 'download_queue_dlq',
  CUTTER_DLQ: 'cutter_queue_dlq',
  PREVIEW: 'preview_queue'
};
```

## 🎨 Integração com Workers

### **Worker Thread Coordination**
```javascript
// src/index.js - Coordenação central
function spawnWorker(workerPath) {
  const worker = new Worker(workerPath);

  worker.on('message', (payload) => {
    processWorkerNotification(payload);
  });

  worker.on('error', (error) => {
    console.error(`Worker error: ${error}`);
    setTimeout(() => {
      console.log('spawning a new worker...');
      spawnWorker(workerPath);
    }, 5000);
  });

  return worker;
}

// Spawn inicial de workers
setTimeout(() => {
  spawnWorker('./src/workers/download.js');
  spawnWorker('./src/workers/download.js');  // 2 workers de download
  spawnWorker('./src/workers/cutter.js');
}, 10000);
```

### **Event Processing**
```javascript
function processWorkerNotification(payload) {
  const { queueName, filePath, from, noreply, link } = payload;

  switch (queueName) {
    case QUEUE_NAMES.DOWNLOAD:
      processDownloadQueue(payload.results, from, noreply);
      break;
    case QUEUE_NAMES.CUTTER:
      processCutterQueue(filePath, from, noreply);
      break;
    case QUEUE_NAMES.DOWNLOAD_DLQ:
      sendDownloadFailureMessage(from, link);
      break;
    case QUEUE_NAMES.CUTTER_DLQ:
      sendSegmentationFailureMessage(from, filePath);
      break;
  }
}
```

## ⚠️ Casos Extremos e Tratamento de Erros

### **Cenários de Falha**

#### 1. **RabbitMQ Indisponível**
```javascript
// Detecção e tratamento
amqp.connect(connectionString, function (error0, connection) {
  if (error0) {
    console.error('RabbitMQ connection failed:', error0);
    // Implementar retry exponential backoff
    setTimeout(() => attemptReconnection(), 5000);
    throw error0;
  }
});
```

#### 2. **Worker Crash**
```javascript
// Auto-recovery implementado
worker.on('error', (error) => {
  console.error(`Worker error: ${error}`);
  setTimeout(() => {
    console.log('spawning a new worker...');
    spawnWorker(workerPath);
  }, 5000);
});
```

#### 3. **Message Corruption**
```javascript
// Tratamento de mensagens inválidas
try {
  const payload = JSON.parse(msg.content.toString());
  // Validação de schema se necessário
  validatePayload(payload);
} catch (e) {
  console.error('Invalid message format:', e);
  channel.reject(msg, false); // Rejeitar sem requeue
}
```

#### 4. **DLQ Overflow**
- **Problema**: DLQ acumula muitas mensagens
- **Detecção**: Monitoramento de tamanho de fila
- **Ação**: Alertas automáticos
- **Limpeza**: Scripts de manutenção periódica

### **Recuperação e Resiliência**

#### **Connection Recovery**
```javascript
// Implementação de connection pooling e retry
class RabbitMQManager {
  constructor() {
    this.connection = null;
    this.channels = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }
  
  async connect() {
    try {
      this.connection = await amqp.connect(connectionString);
      this.reconnectAttempts = 0;
      this.setupErrorHandlers();
    } catch (error) {
      await this.handleConnectionError(error);
    }
  }
  
  async handleConnectionError(error) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      setTimeout(() => this.connect(), delay);
      this.reconnectAttempts++;
    }
  }
}
```

## 📊 Métricas e Monitoramento

### **Métricas Operacionais**
```javascript
// Logs implementados
console.log(`Listening to queue '${queueName}'`);
console.log(`Enqueued Job for queue: ${queueName}`);
console.log(`Message retried (${retryCount + 1} retries).`);
console.log(`Maximum retry count reached. Rejecting message.`);
```

### **KPIs do Sistema**
- **Throughput**: Jobs processados por minuto
- **Latência**: Tempo médio de processamento
- **Taxa de Erro**: Jobs falhados / Jobs totais
- **Taxa de Retry**: Jobs que precisaram retry
- **Utilização de Workers**: Workers ativos / Workers totais

### **Dashboards Sugeridos**
```javascript
// Métricas coletáveis via RabbitMQ Management API
const metrics = {
  queueLength: 'Número de mensagens pendentes',
  consumerCount: 'Número de consumers ativos',
  messageRate: 'Taxa de mensagens por segundo',
  ackRate: 'Taxa de acknowledgments',
  rejectRate: 'Taxa de rejects'
};
```

### **Alertas Críticos**
- 🚨 RabbitMQ connection lost
- 🚨 Queue length > 100 mensagens
- 🚨 Worker crash rate > 10%
- 🚨 DLQ accumulation > 50 mensagens

## 🚀 Otimizações e Melhorias Futuras

### **Curto Prazo**
- 📊 Métricas detalhadas por fila
- 🔧 Configuração dinâmica de workers
- 📈 Dashboard de monitoramento

### **Médio Prazo**
- 🎯 Priority queues para jobs urgentes
- 🔄 Load balancing inteligente
- 📦 Batching de mensagens relacionadas

### **Longo Prazo**
- ☁️ Cluster RabbitMQ para alta disponibilidade
- 🤖 Auto-scaling baseado em métricas
- 🧠 Machine learning para otimização de routing

### **Configurações Avançadas**
```javascript
// Futuras implementações
const advancedConfig = {
  exchanges: {
    direct: 'direct_exchange',
    topic: 'topic_exchange',
    fanout: 'broadcast_exchange'
  },
  routing: {
    priority: true,
    ttl: 3600000, // 1 hora
    maxRetries: 5,
    backoffStrategy: 'exponential'
  },
  clustering: {
    nodes: ['rabbit1', 'rabbit2', 'rabbit3'],
    policy: 'ha-all'
  }
};
```