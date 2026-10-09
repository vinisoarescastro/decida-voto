import Image from "next/image";

/**
 * Logomarca com troca automática para o modo escuro (azul-marinho clareado para manter o contraste).
 * A altura é definida pela classe recebida; a largura acompanha a proporção da imagem.
 */
export function Logo({ className = "h-7", alt = "" }: { className?: string; alt?: string }) {
  return (
    <>
      <Image src="/logo.png" alt={alt} width={744} height={145} className={`w-auto dark:hidden ${className}`} />
      <Image src="/logo-dark.png" alt="" aria-hidden="true" width={744} height={145} className={`hidden w-auto dark:block ${className}`} />
    </>
  );
}
