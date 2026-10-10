import Image from "next/image";

/**
 * Logomarca com troca automática para o modo escuro (texto claro e contorno claro na mascote, para manter o contraste).
 * A altura vem da classe recebida; a largura acompanha a proporção da imagem.
 */
export function Logo({ className = "h-7", alt = "" }: { className?: string; alt?: string }) {
  return (
    <>
      <Image src="/logo.png" alt={alt} width={889} height={320} priority className={`w-auto dark:hidden ${className}`} />
      <Image src="/logo-dark.png" alt="" aria-hidden="true" width={889} height={320} className={`hidden w-auto dark:block ${className}`} />
    </>
  );
}
