import { createBrowserRouter } from "react-router";
import { RootLayout } from "./pages/RootLayout";
import { HomePage } from "./pages/HomePage";
import { LibraryPage } from "./pages/LibraryPage";
import { FlashcardsLandingPage } from "./pages/FlashcardsLandingPage";
import { FlashcardsPage } from "./pages/FlashcardsPage";
import { ReadingPage } from "./pages/ReadingPage";
import { ReadingDetailPage } from "./pages/ReadingDetailPage";
import { VocabularyPage } from "./pages/VocabularyPage";
import { StatisticsPage } from "./pages/StatisticsPage";
import { TranslationPage } from "./pages/TranslationPage";
import { AddCardsPage } from "./pages/AddCardsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { StudyPage } from "./pages/StudyPage";
import { QuizPage } from "./pages/QuizPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ErrorPage } from "./pages/ErrorPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    ErrorBoundary: ErrorPage,
    children: [
      {
        index: true,
        Component: HomePage,
      },
      {
        path: "library",
        Component: LibraryPage,
      },
      {
        path: "library/:deckId/study",
        Component: StudyPage,
      },
      {
        path: "library/:deckId/quiz",
        Component: QuizPage,
      },
      {
        path: "flashcards",
        Component: FlashcardsLandingPage,
      },
      {
        path: "flashcards/study",
        Component: FlashcardsPage,
      },
      {
        path: "reading",
        Component: ReadingPage,
      },
      {
        path: "reading/:id",
        Component: ReadingDetailPage,
      },
      {
        path: "vocabulary",
        Component: VocabularyPage,
      },
      {
        path: "statistics",
        Component: StatisticsPage,
      },
      {
        path: "translation",
        Component: TranslationPage,
      },
      {
        path: "decks/add-cards",
        Component: AddCardsPage,
      },
      {
        path: "settings",
        Component: SettingsPage,
      },
      {
        path: "*",
        Component: NotFoundPage,
      },
    ],
  },
]);