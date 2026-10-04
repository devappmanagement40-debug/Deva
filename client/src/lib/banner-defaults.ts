import miningExcavatorPhoto from "@assets/compress_actuality_teaser_1623317774_1791124161647.jpg";
import miningTrucksPhoto from "@assets/shutterstock_1257632146-1024x683_1791124161721.jpg";
import undergroundMinerPhoto from "@assets/Top-10-Mining-Companies-in-Africa_1791124161785.jpg";
import undergroundWorkPhoto from "@assets/Mines-travaux-770x470_1791124161825.jpg";
import bannerTeamPhoto from "@/assets/images/diamant-banner-team-dsc-0636.jpg";
import bannerLeadershipPhoto from "@/assets/images/diamant-banner-leadership-team.jpg";
import bannerMeganePhoto from "@/assets/images/diamant-banner-megane.jpg";

export const HOME_BANNER_DEFAULT_IMAGES = [
  miningExcavatorPhoto,
  miningTrucksPhoto,
  undergroundMinerPhoto,
  undergroundWorkPhoto,
];

export const ACCOUNT_BANNER_DEFAULT_POSTERS = [
  { id: "team-photo", src: bannerTeamPhoto, slideWidth: 198, fit: "cover" },
  { id: "leadership-team-photo", src: bannerLeadershipPhoto, slideWidth: 318, fit: "cover" },
  { id: "megane-photo", src: bannerMeganePhoto, slideWidth: 132, fit: "contain" },
] as const;

export const ACCOUNT_BANNER_DEFAULT_IMAGES = ACCOUNT_BANNER_DEFAULT_POSTERS.map(({ src }) => src);

export function buildAccountBannerPosters(images: readonly string[]) {
  return images.map((src, index) => {
    const defaults =
      ACCOUNT_BANNER_DEFAULT_POSTERS.find((poster) => poster.src === src) ??
      ACCOUNT_BANNER_DEFAULT_POSTERS[index];

    return {
      id: defaults?.id ?? `custom-${index}`,
      src,
      slideWidth: defaults?.slideWidth ?? 220,
      fit: defaults?.fit ?? "cover",
    };
  });
}