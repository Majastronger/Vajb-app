// Ready-made hashtag sets per topic. Balkan sets for hr/bs/sr, international ones (with German) for de/en.
import type { Lang } from './i18n';

type Topic = {
  id: string;
  icon: string;
  name: { hr: string; bs?: string; de: string; en: string };
  balkan: string;
  world: string;
};

export const HASHTAG_TOPICS: Topic[] = [
  {
    id: 'sea', icon: '🌊', name: { hr: 'More i plaža', de: 'Meer & Strand', en: 'Beach & sea' },
    balkan: '#more #plaža #ljeto #jadran #balkan #summervibes #beachlife #sunset #seaview #adriatic',
    world: '#beach #sea #summer #summervibes #beachlife #sunset #meer #strand #urlaub #ocean',
  },
  {
    id: 'food', icon: '🍕', name: { hr: 'Hrana', de: 'Essen', en: 'Food' },
    balkan: '#hrana #foodie #fino #instafood #domaćahrana #ručak #foodlover #yummy #balkanfood #foodphotography',
    world: '#food #foodie #instafood #yummy #foodlover #essen #lecker #homemade #foodphotography #delicious',
  },
  {
    id: 'travel', icon: '✈️', name: { hr: 'Putovanja', de: 'Reisen', en: 'Travel' },
    balkan: '#putovanja #travel #wanderlust #travelgram #instatravel #explore #vikend #roadtrip #balkantravel #putujemo',
    world: '#travel #wanderlust #travelgram #explore #reisen #urlaub #instatravel #adventure #roadtrip #weekendtrip',
  },
  {
    id: 'coffee', icon: '☕', name: { hr: 'Kava', bs: 'Kafa', de: 'Kaffee', en: 'Coffee' },
    balkan: '#kava #kafa #coffee #coffeetime #jutro #coffeelover #kafica #butfirstcoffee #cafe #goodmorning',
    world: '#coffee #coffeetime #kaffee #coffeelover #morning #butfirstcoffee #cafe #goodmorning #kaffeezeit #latte',
  },
  {
    id: 'gym', icon: '💪', name: { hr: 'Teretana', de: 'Gym', en: 'Gym' },
    balkan: '#teretana #fitness #gym #trening #workout #fitlife #motivacija #gymlife #zdravlje #nopainnogain',
    world: '#gym #fitness #workout #training #fitlife #motivation #gymlife #sport #fitnessmotivation #health',
  },
  {
    id: 'love', icon: '❤️', name: { hr: 'Ljubav', de: 'Liebe', en: 'Love' },
    balkan: '#ljubav #love #couple #mojaljubav #zajedno #couplegoals #romantika #volimte #lovestory #happy',
    world: '#love #couple #couplegoals #liebe #together #relationship #lovestory #happy #romance #mylove',
  },
  {
    id: 'friends', icon: '👯', name: { hr: 'Ekipa', de: 'Freunde', en: 'Friends' },
    balkan: '#ekipa #friends #prijatelji #bestfriends #squad #dobravibra #friendship #goodtimes #vikend #smijeh',
    world: '#friends #bestfriends #squad #freunde #friendship #goodtimes #weekend #fun #memories #goodvibes',
  },
  {
    id: 'selfie', icon: '🤳', name: { hr: 'Selfie', de: 'Selfie', en: 'Selfie' },
    balkan: '#selfie #me #selfietime #smile #mood #instadaily #photooftheday #vibes #portrait #instagood',
    world: '#selfie #me #selfietime #smile #mood #instadaily #photooftheday #vibes #portrait #instagood',
  },
  {
    id: 'nature', icon: '🌿', name: { hr: 'Priroda', de: 'Natur', en: 'Nature' },
    balkan: '#priroda #nature #naturelovers #hiking #planina #sunset #green #outdoors #mountains #naturephotography',
    world: '#nature #naturelovers #hiking #wandern #mountains #outdoors #natur #sunset #green #naturephotography',
  },
  {
    id: 'party', icon: '🎉', name: { hr: 'Izlazak', de: 'Party', en: 'Night out' },
    balkan: '#izlazak #party #nightout #subota #petak #vikend #goodvibes #clubbing #drinks #noć',
    world: '#party #nightout #weekend #goodvibes #clubbing #drinks #friday #saturday #nightlife #fun',
  },
  {
    id: 'outfit', icon: '👗', name: { hr: 'Outfit', de: 'Outfit', en: 'Outfit' },
    balkan: '#outfit #ootd #moda #fashion #style #stil #outfitoftheday #lookoftheday #streetstyle #fashionista',
    world: '#outfit #ootd #fashion #style #outfitoftheday #mode #lookoftheday #streetstyle #fashionista #styleinspo',
  },
  {
    id: 'birthday', icon: '🎂', name: { hr: 'Rođendan', de: 'Geburtstag', en: 'Birthday' },
    balkan: '#rođendan #birthday #happybirthday #sretanrođendan #bday #slavlje #birthdaygirl #party #torta #celebration',
    world: '#birthday #happybirthday #bday #geburtstag #birthdaygirl #party #cake #celebration #birthdayparty #allesgute',
  },
];

export function topicName(topic: Topic, lang: Lang) {
  if (lang === 'de' || lang === 'en') return topic.name[lang];
  if (lang === 'hr') return topic.name.hr;
  return topic.name.bs ?? topic.name.hr;
}

export function topicTags(topic: Topic, lang: Lang) {
  return lang === 'de' || lang === 'en' ? topic.world : topic.balkan;
}
