import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CONTACT_EMAIL, CONTROLADOR, RETENCAO_PARTICIPACOES } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacidade e termos de uso",
  description: "Quais dados o Decida Voto coleta, para quê, por quanto tempo e como são protegidos.",
};

function Secao({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="text-lg font-semibold">
        {titulo}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted">{children}</div>
    </section>
  );
}

const lista = "list-disc space-y-2 pl-5";

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-12 px-6 pt-14 sm:pt-20">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Privacidade e termos de uso</h1>
        <p className="text-muted">
          Opiniões políticas são dados pessoais sensíveis pela Lei Geral de Proteção de Dados (LGPD, art. 5º, II). Por isso
          coletamos o mínimo possível, sem nada que identifique você diretamente, e só com o seu consentimento.
        </p>
      </header>

      <Secao id="coletados" titulo="O que coletamos">
        <ul className={lista}>
          <li>
            <strong className="text-ink">Perfil:</strong> estado, cidade, gênero e faixa etária. A idade é usada apenas para
            definir a faixa (por exemplo, 25 a 34 anos); a idade exata não é guardada.
          </li>
          <li>
            <strong className="text-ink">Respostas:</strong> a alternativa escolhida em cada pergunta e o resultado de
            afinidade calculado a partir delas.
          </li>
          <li>
            <strong className="text-ink">Data do envio</strong>, sem horário.
          </li>
        </ul>
        <p>
          <strong className="text-ink">Não coletamos</strong> nome, e-mail, CPF, telefone, endereço, idade exata nem
          qualquer identificador do seu aparelho. O endereço IP não é gravado junto com as respostas.
        </p>
      </Secao>

      <Secao id="finalidade" titulo="Para que usamos">
        <ul className={lista}>
          <li>
            Para produzir estatísticas gerais e agregadas sobre a afinidade com os candidatos por estado, cidade, gênero e
            faixa etária, de uso interno da equipe do Decida Voto.
          </li>
          <li>
            Grupos com poucas participações não são exibidos nem mesmo internamente, para evitar que alguém seja
            identificado indiretamente.
          </li>
          <li>
            Não vendemos, não compartilhamos e não publicamos esses dados. Os resultados agregados não são divulgados, porque
            o Decida Voto não é pesquisa eleitoral.
          </li>
        </ul>
      </Secao>

      <Secao id="base-legal" titulo="Base legal e seus direitos">
        <p>
          O tratamento se baseia no seu <strong className="text-ink">consentimento específico e destacado</strong> (LGPD,
          art. 11, I), manifestado ao clicar em “Continuar” na tela “Antes de começar”, onde este tratamento é informado. Você pode pedir informações sobre o tratamento
          pelo canal de contato abaixo.
        </p>
        <p>
          Como não guardamos nenhum dado que identifique você, não é possível localizar depois uma participação específica
          para consultá-la, corrigi-la ou excluí-la individualmente. Todas as participações são excluídas no prazo indicado
          abaixo.
        </p>
      </Secao>

      <Secao id="retencao" titulo="Por quanto tempo guardamos">
        <ul className={lista}>
          <li>
            <strong className="text-ink">Participações:</strong> até {RETENCAO_PARTICIPACOES}, quando são excluídas
            automaticamente. As cópias de segurança são mantidas por até 14 dias.
          </li>
          <li>
            <strong className="text-ink">Controle de abuso:</strong> para limitar envios automatizados, usamos um código
            gerado a partir do endereço IP com uma chave que muda todos os dias. O IP em si não é guardado, e esses códigos
            são apagados em até 48 horas.
          </li>
          <li>
            <strong className="text-ink">Registros do servidor:</strong> como qualquer site, o servidor registra acessos às
            páginas (IP, data, hora e página) para segurança. O envio das respostas não é registrado nesses logs.
          </li>
        </ul>
      </Secao>

      <Secao id="cookies" titulo="Cookies">
        <ul className={lista}>
          <li>
            Depois de enviar suas respostas, gravamos um cookie técnico no seu navegador por 30 dias. Ele só indica que este
            aparelho já participou, para evitar envios repetidos, e não contém nenhum dado sobre você ou suas respostas.
          </li>
          <li>Não usamos cookies de rastreamento, ferramentas de análise de audiência nem pixels de publicidade.</li>
          <li>As fontes tipográficas são servidas pelo próprio site, sem chamadas a serviços de terceiros.</li>
        </ul>
      </Secao>

      <Secao id="seguranca" titulo="Segurança">
        <ul className={lista}>
          <li>O banco de dados não é acessível pela internet, apenas pela própria aplicação.</li>
          <li>A área administrativa exige autenticação e mostra somente números agregados, nunca respostas individuais.</li>
          <li>Toda a comunicação com o site é criptografada (HTTPS).</li>
        </ul>
      </Secao>

      <Secao id="termos" titulo="Natureza da ferramenta">
        <ul className={lista}>
          <li>
            O Decida Voto é uma ferramenta informativa e independente, sem vínculo com candidatos, partidos, coligações ou
            com a Justiça Eleitoral.
          </li>
          <li>
            Não é pesquisa eleitoral, não mede intenção de voto e não deve ser divulgado como tal. O resultado não é uma
            recomendação de voto.
          </li>
          <li>
            As posições atribuídas aos candidatos se baseiam em fontes públicas listadas na página de metodologia e podem
            conter imprecisões ou ficar desatualizadas.
          </li>
          <li>Os links para notícias e fontes levam a sites de terceiros, que têm suas próprias políticas de privacidade.</li>
        </ul>
      </Secao>

      {(CONTROLADOR || CONTACT_EMAIL) && (
        <Secao id="contato" titulo="Responsável e contato">
          {CONTROLADOR && <p>Responsável pelo tratamento dos dados: {CONTROLADOR}.</p>}
          {CONTACT_EMAIL && (
            <p>
              Dúvidas e solicitações:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-4">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          )}
        </Secao>
      )}
    </div>
  );
}
