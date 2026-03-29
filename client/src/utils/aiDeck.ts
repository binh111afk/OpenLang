import { fetchJson } from '@/utils/api';

interface GenerateAIDeckParams {
  topic: string;
  language: 'english' | 'japanese';
  cardCount: number;
  difficultyRating: number;
}

interface GeneratedCard {
  frontWord: string;
  frontFurigana?: string;
  backMeaning: string;
  example: string;
  exampleTranslation: string;
}

interface GeneratedDeckPayload {
  deckName: string;
  description?: string;
  cards: GeneratedCard[];
}

export async function createDeckWithAI(params: GenerateAIDeckParams) {
  const generated = await fetchJson<GeneratedDeckPayload>('/api/ai-generate-deck', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!generated.cards?.length) {
    throw new Error('AI chưa tạo được danh sách thẻ hợp lệ.');
  }

  const deckResponse = await fetchJson<{
    deck: {
      id: string;
      name: string;
      language: 'english' | 'japanese';
      cover_image?: string | null;
      difficulty_rating?: number | null;
    };
  }>('/api/library', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: generated.deckName || params.topic,
      language: params.language,
      description: generated.description || null,
      difficultyRating: params.difficultyRating,
    }),
  });

  const deckId = deckResponse.deck.id;

  for (const card of generated.cards) {
    await fetchJson('/api/flashcards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deckId,
        language: params.language,
        frontWord: card.frontWord,
        frontFurigana: card.frontFurigana || null,
        backMeaning: card.backMeaning,
        example: card.example,
        exampleTranslation: card.exampleTranslation,
      }),
    });
  }

  await fetchJson('/api/flashcard-images', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ deckId }),
  });

  return {
    deckId,
    deckName: deckResponse.deck.name,
    deckCoverImage: deckResponse.deck.cover_image || undefined,
    deckRating: deckResponse.deck.difficulty_rating ?? params.difficultyRating,
    language: deckResponse.deck.language,
  };
}
