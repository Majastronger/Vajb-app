import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { ApiError, generate, type GenerateResult, type Mode } from './src/api';

const light = {
  bg: '#FFFFFF', card: '#F5F6FB', fg: '#161A2E', muted: '#5E6480', line: '#DDE0EC',
  accent: '#E3246E', accentFg: '#FFFFFF', sun: '#FFC83D', sunFg: '#2A2100', ok: '#138A5B',
};
const dark: typeof light = {
  bg: '#131629', card: '#1B1F36', fg: '#EEF0FA', muted: '#9AA0BD', line: '#2A2F4D',
  accent: '#FF4F8E', accentFg: '#1A0610', sun: '#FFD25E', sunFg: '#2A2100', ok: '#3DD39A',
};
type Colors = typeof light;

type Tab = Mode | 'pro';
const FREE_PER_DAY = 5;

type Field = { key: string; label: string; options: string[] };
type Screen = {
  title: string;
  subtitle: string;
  inputLabel: string;
  placeholder: string;
  fields: Field[];
  button: string;
  photo?: boolean;
};

const SCREENS: Record<Mode, Screen> = {
  caption: {
    title: 'Opis za tvoju objavu',
    subtitle: 'Opiši fotku ili video, AI složi opis i hashtagove.',
    inputLabel: 'Što je na objavi?',
    placeholder: 'npr. Ja i ekipa na plaži u Makarskoj, zalazak sunca',
    fields: [
      { key: 'platform', label: 'Mreža', options: ['Instagram', 'TikTok', 'Facebook'] },
      { key: 'tone', label: 'Stil', options: ['Opušteno', 'Duhovito', 'Romantično', 'Motivacijski', 'Misteriozno'] },
      { key: 'language', label: 'Jezik', options: ['Hrvatski', 'English'] },
    ],
    button: 'Napravi opis ✨',
    photo: true,
  },
  reply: {
    title: 'Što da odgovorim?',
    subtitle: 'Zalijepi poruku koju si dobio/la i odaberi kako želiš zvučati.',
    inputLabel: 'Poruka koju si dobio/la',
    placeholder: 'npr. Hej, jesi za piće ovaj vikend? 🍹',
    fields: [
      { key: 'sender', label: 'Tko ti piše', options: ['Simpatija', 'Prijatelj', 'Ekipa u grupi', 'Posao'] },
      { key: 'tone', label: 'Kako želiš zvučati', options: ['Duhovito', 'Opušteno', 'Flert', 'Samouvjereno', 'Pristojno odbij'] },
    ],
    button: 'Predloži odgovore 💬',
  },
  bio: {
    title: 'Bio za profil',
    subtitle: 'Napiši par riječi o sebi, dobiješ bio za Instagram ili TikTok.',
    inputLabel: 'O tebi',
    placeholder: 'npr. studentica, Zagreb, volim kavu, techno i putovanja',
    fields: [
      { key: 'platform', label: 'Za', options: ['Instagram', 'TikTok', 'Tinder/Bumble', 'LinkedIn'] },
      { key: 'tone', label: 'Stil', options: ['Cool', 'Duhovito', 'Minimal', 'Ozbiljno'] },
    ],
    button: 'Napravi bio 🪄',
  },
};

function defaults(mode: Mode) {
  return Object.fromEntries(SCREENS[mode].fields.map((f) => [f.key, f.options[0]]));
}

export default function App() {
  const c = useColorScheme() === 'dark' ? dark : light;
  const [tab, setTab] = useState<Tab>('caption');
  const [remaining, setRemaining] = useState<number | null>(FREE_PER_DAY);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[s.root, { backgroundColor: c.bg }]} edges={['top', 'bottom']}>
        <StatusBar style="auto" />
        <View style={s.header}>
          <Text style={[s.logo, { color: c.fg }]}>
            vajb<Text style={{ color: c.accent }}>.</Text>ai
          </Text>
          <View style={[s.credits, remaining === null ? { backgroundColor: c.sun } : { backgroundColor: c.card, borderColor: c.line, borderWidth: 1 }]}>
            <Text style={[s.creditsText, { color: remaining === null ? c.sunFg : c.fg }]}>
              {remaining === null ? 'PREMIUM' : `${remaining}/${FREE_PER_DAY} danas`}
            </Text>
          </View>
        </View>

        {tab === 'pro' ? (
          <Premium c={c} />
        ) : (
          <Generator key={tab} mode={tab} c={c} onRemaining={setRemaining} onLimit={() => setTab('pro')} />
        )}

        <View style={[s.nav, { borderTopColor: c.line }]}>
          {([
            ['caption', '📸', 'Objava'],
            ['reply', '💬', 'Odgovor'],
            ['bio', '👤', 'Bio'],
            ['pro', '👑', 'Premium'],
          ] as const).map(([key, icon, label]) => (
            <Pressable key={key} style={s.navBtn} onPress={() => setTab(key)} accessibilityRole="tab" accessibilityState={{ selected: tab === key }}>
              <Text style={s.navIcon}>{icon}</Text>
              <Text style={[s.navLabel, { color: tab === key ? c.accent : c.muted }]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function Generator({ mode, c, onRemaining, onLimit }: {
  mode: Mode; c: Colors; onRemaining: (n: number | null) => void; onLimit: () => void;
}) {
  const screen = SCREENS[mode];
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<Record<string, string>>(() => defaults(mode));
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<GenerateResult | null>(null);

  async function pickPhoto() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.4, base64: true });
    if (!res.canceled && res.assets[0]?.base64) setPhoto(res.assets[0]);
  }

  async function run() {
    if (!input.trim() && !photo) {
      setError('Napiši nešto u polje iznad.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const r = await generate({
        mode,
        input: input.trim(),
        options,
        image: photo?.base64 ? { base64: photo.base64, mediaType: photo.mimeType ?? 'image/jpeg' } : undefined,
      });
      setResult(r);
      onRemaining(r.remaining);
    } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError('unknown', 'Nešto je pošlo po zlu. Probaj opet.');
      if (err.code === 'limit') {
        onRemaining(0);
        onLimit();
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.main} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={[s.h1, { color: c.fg }]}>{screen.title}</Text>
          <Text style={[s.sub, { color: c.muted }]}>{screen.subtitle}</Text>
        </View>

        {screen.photo && (
          <Pressable onPress={pickPhoto} style={[s.photo, { borderColor: c.line }]}>
            {photo ? <Image source={{ uri: photo.uri }} style={s.thumb} /> : <Text style={{ fontSize: 22 }}>📷</Text>}
            <Text style={[s.photoText, { color: c.muted }]}>{photo ? 'Promijeni fotku' : 'Dodaj fotku (nije obavezno)'}</Text>
          </Pressable>
        )}

        <View>
          <Text style={[s.label, { color: c.muted }]}>{screen.inputLabel.toUpperCase()}</Text>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={screen.placeholder}
            placeholderTextColor={c.muted}
            multiline
            maxLength={1000}
            style={[s.input, { backgroundColor: c.card, borderColor: c.line, color: c.fg }]}
          />
        </View>

        {screen.fields.map((f) => (
          <View key={f.key}>
            <Text style={[s.label, { color: c.muted }]}>{f.label.toUpperCase()}</Text>
            <View style={s.chips}>
              {f.options.map((o) => {
                const on = options[f.key] === o;
                return (
                  <Pressable
                    key={o}
                    onPress={() => setOptions({ ...options, [f.key]: o })}
                    style={[s.chip, { borderColor: on ? c.fg : c.line, backgroundColor: on ? c.fg : 'transparent' }]}
                  >
                    <Text style={[s.chipText, { color: on ? c.bg : c.fg }]}>{o}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        <Pressable onPress={run} disabled={loading} style={[s.go, { backgroundColor: c.accent, opacity: loading ? 0.6 : 1 }]}>
          {loading ? <ActivityIndicator color={c.accentFg} /> : <Text style={[s.goText, { color: c.accentFg }]}>{screen.button}</Text>}
        </Pressable>

        {!!error && <Text style={[s.sub, { color: c.muted }]}>{error}</Text>}

        {result?.items.map((item, i) => <ResultCard key={i} tag={item.tag} text={item.text} c={c} />)}
        {!!result?.hashtags && <ResultCard tag="Hashtagovi" text={result.hashtags} c={c} muted />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ResultCard({ tag, text, c, muted }: { tag: string; text: string; c: Colors; muted?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <View style={[s.card, { backgroundColor: c.card, borderColor: c.line }]}>
      <Text style={[s.tag, { color: c.accent }]}>{tag.toUpperCase()}</Text>
      <Text selectable style={[s.cardText, { color: muted ? c.muted : c.fg, fontWeight: muted ? '600' : '400' }]}>{text}</Text>
      <Pressable
        onPress={async () => {
          await Clipboard.setStringAsync(text);
          setCopied(true);
        }}
        style={[s.copy, { borderColor: copied ? c.ok : c.line }]}
      >
        <Text style={{ color: copied ? c.ok : c.fg, fontWeight: '600', fontSize: 13 }}>{copied ? 'Kopirano ✓' : 'Kopiraj'}</Text>
      </Pressable>
    </View>
  );
}

function Premium({ c }: { c: Colors }) {
  const [plan, setPlan] = useState<'m' | 'y'>('y');
  return (
    <ScrollView contentContainerStyle={s.main}>
      <View style={[s.proHero, { backgroundColor: c.fg }]}>
        <Text style={[s.proTitle, { color: c.bg }]}>Vajb Premium</Text>
        {['Neograničeno generiranja', 'Bez reklama', 'Novi stilovi prvi'].map((t) => (
          <Text key={t} style={{ color: c.bg, fontSize: 15 }}>•  {t}</Text>
        ))}
      </View>
      <View style={s.plans}>
        {([
          ['m', 'Mjesečno', '3,99 €', 'otkaži kad želiš'],
          ['y', 'Godišnje · −48%', '24,99 €', '2,08 € mjesečno'],
        ] as const).map(([key, name, price, note]) => (
          <Pressable key={key} onPress={() => setPlan(key)} style={[s.plan, { backgroundColor: c.card, borderColor: plan === key ? c.accent : c.line }]}>
            <Text style={{ color: c.muted, fontSize: 13 }}>{name}</Text>
            <Text style={[s.price, { color: c.fg }]}>{price}</Text>
            <Text style={{ color: c.muted, fontSize: 13 }}>{note}</Text>
          </Pressable>
        ))}
      </View>
      <View style={[s.go, { backgroundColor: c.accent, opacity: 0.6 }]}>
        <Text style={[s.goText, { color: c.accentFg }]}>Uskoro</Text>
      </View>
      <Text style={[s.sub, { color: c.muted }]}>
        Premium stiže uskoro. Do tada imaš {FREE_PER_DAY} besplatnih generiranja svaki dan.
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  credits: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99 },
  creditsText: { fontSize: 13, fontWeight: '700' },
  main: { padding: 16, gap: 16 },
  h1: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  sub: { fontSize: 15, lineHeight: 21 },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 14, padding: 12, fontSize: 15, minHeight: 84, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 7 },
  chipText: { fontSize: 14, fontWeight: '600' },
  photo: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 14, padding: 10 },
  photoText: { fontWeight: '600', fontSize: 15 },
  thumb: { width: 44, height: 44, borderRadius: 10 },
  go: { borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  goText: { fontSize: 16, fontWeight: '700' },
  card: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 8 },
  tag: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  cardText: { fontSize: 15, lineHeight: 22 },
  copy: { alignSelf: 'flex-end', borderWidth: 1, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  nav: { flexDirection: 'row', borderTopWidth: 1 },
  navBtn: { flex: 1, alignItems: 'center', paddingTop: 8, paddingBottom: 6, gap: 2 },
  navIcon: { fontSize: 20 },
  navLabel: { fontSize: 12, fontWeight: '600' },
  proHero: { borderRadius: 20, padding: 20, gap: 8 },
  proTitle: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  plans: { flexDirection: 'row', gap: 10 },
  plan: { flex: 1, borderWidth: 1.5, borderRadius: 16, padding: 12, gap: 2 },
  price: { fontSize: 22, fontWeight: '800' },
});
