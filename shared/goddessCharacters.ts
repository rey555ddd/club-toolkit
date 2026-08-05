export const goddessCharacters = [
  { id: "ct-a01", name: "曜晴", tag: "豐滿辣姊", image: "/characters/ct-a01-yaoqing.jpg", identity: "adult Taiwanese woman, glamorous mature oval face, long glossy dark waves, curvy hourglass figure, fuller bust, long legs, confident elegant expression" },
  { id: "ct-a02", name: "米亞", tag: "俏麗短髮", image: "/characters/ct-a02-mia.jpg", identity: "adult Taiwanese woman, lively heart-shaped face, chic short bob, deep chocolate hair with berry-purple underlayer, bright playful expression, slim long-legged figure" },
  { id: "ct-a03", name: "凱莉", tag: "豐滿女神", image: "/characters/ct-a03-kelly.jpg", identity: "adult Taiwanese woman, refined almond eyes, long chestnut waves, curvy hourglass figure, especially fuller bust, narrow waist, long legs, poised sultry expression" },
  { id: "ct-a04", name: "若熙", tag: "清冷氣質", image: "/characters/ct-a04-ruoxi.jpg", identity: "adult Taiwanese woman, delicate long oval face, straight dark hair, cool refined gaze, tall slender silhouette, understated luxury presence" },
  { id: "ct-a05", name: "安娜", tag: "混血時尚", image: "/characters/ct-a05-anna.jpg", identity: "adult Taiwanese woman, softly angular face, warm brown wavy hair, fashionable confident gaze, balanced feminine curves and long legs" },
  { id: "ct-a06", name: "樂樂", tag: "甜美親和", image: "/characters/ct-a06-lele.jpg", identity: "adult Taiwanese woman, sweet rounded-oval face, dark softly waved hair, warm genuine smile, graceful slim figure and approachable energy" },
] as const;

export type GoddessCharacterId = (typeof goddessCharacters)[number]["id"];
