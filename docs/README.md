# Documentação - WhatsApp Meme Downloader

Bem-vindo à documentação técnica do WhatsApp Meme Downloader, um bot do WhatsApp para download de memes e vídeos de redes sociais.

## 📋 Índice da Documentação

### 🏗️ Arquitetura e Visão Geral
- [**Arquitetura do Sistema**](./architecture.md) - Visão geral da arquitetura, componentes e infraestrutura

### 🔗 Integrações e Dependências
- [**Integrações Externas**](./integrations.md) - APIs, serviços externos e dependências

### 💼 Lógica de Negócio
- [**Lógica de Negócio Central**](./business-logic.md) - Processos principais, modelo de domínio e regras de negócio

### ⚡ Funcionalidades
- [**Lista de Funcionalidades**](./features.md) - Visão geral de todas as funcionalidades principais

#### 📁 Documentação Detalhada por Funcionalidade
- [**Bot do WhatsApp**](./features/whatsapp-bot.md) - Cliente WhatsApp e processamento de comandos
- [**Sistema de Download**](./features/download-system.md) - Download de vídeos de redes sociais
- [**Processamento de Vídeo**](./features/video-processing.md) - Segmentação e processamento de vídeos
- [**Sistema de Filas**](./features/queue-system.md) - Processamento assíncrono com RabbitMQ
- [**Gerenciamento de Workers**](./features/worker-management.md) - Workers em background para processamento

## 🚀 Como Usar Esta Documentação

Esta documentação foi criada para desenvolvedores que desejam:
- Compreender a arquitetura do sistema
- Contribuir com novas funcionalidades
- Realizar manutenção e debugging
- Integrar o sistema com outros serviços

### 📖 Guia de Leitura Recomendado

1. **Iniciantes**: Comece com [Arquitetura](./architecture.md) → [Funcionalidades](./features.md)
2. **Desenvolvedores**: [Lógica de Negócio](./business-logic.md) → Funcionalidades específicas
3. **DevOps/Infra**: [Integrações](./integrations.md) → [Arquitetura](./architecture.md)

## 🔧 Tecnologias Principais

- **Node.js** - Runtime JavaScript
- **WhatsApp Web.js** - Cliente WhatsApp
- **RabbitMQ** - Sistema de filas
- **Puppeteer** - Web scraping
- **FFmpeg** - Processamento de vídeo
- **Docker** - Containerização

## 📝 Contribuindo com a Documentação

Para manter a documentação atualizada:
1. Cada funcionalidade possui seu próprio arquivo
2. Mantenha os diagramas Mermaid atualizados
3. Documente mudanças na lógica de negócio
4. Atualize integrações quando adicionar/remover dependências