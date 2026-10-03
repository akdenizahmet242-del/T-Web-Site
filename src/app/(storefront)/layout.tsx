import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SmoothScroll } from "@/components/providers/smooth-scroll";
import { CartSheet } from "@/features/cart/cart-sheet";
import { CartSync } from "@/features/cart/cart-sync";
import { getCategories } from "@/features/catalog/queries";

/**
 * Storefront kabuğu tamamen statiktir: burada cookies()/headers()/auth()
 * çağrılmaz. Kişiye özel her şey (sepet, oturum) istemcide yüklenir; böylece
 * tüm vitrin sayfaları CDN'de önbelleklenebilir.
 */
export default async function StorefrontLayout({ children }: LayoutProps<"/">) {
  const categories = await getCategories();

  return (
    <>
      <SmoothScroll />
      <CartSync />
      <SiteHeader categories={categories} />
      <main>{children}</main>
      <SiteFooter categories={categories} />
      <CartSheet />
    </>
  );
}
