// Server Component — fetches data via use cases and passes to HomeClient
import { Suspense } from "react";

import { ChannelRepositoryImpl } from "@/infrastructure/repositories/ChannelRepositoryImpl";
import { StreamRepositoryImpl } from "@/infrastructure/repositories/StreamRepositoryImpl";
import { CategoryRepositoryImpl } from "@/infrastructure/repositories/CategoryRepositoryImpl";
import { CountryRepositoryImpl } from "@/infrastructure/repositories/CountryRepositoryImpl";

import { GetChannelsUseCase } from "@/application/usecases/GetChannelsUseCase";
import { GetStreamsUseCase } from "@/application/usecases/GetStreamsUseCase";
import { GetCategoriesUseCase } from "@/application/usecases/GetCategoriesUseCase";
import { GetCountriesUseCase } from "@/application/usecases/GetCountriesUseCase";

import { HomeClient } from "@/presentation/components/HomeClient";
import { SkeletonGrid } from "@/presentation/components/SkeletonCard";

// ─── Dependency injection (poor-man's DI container) ───────────────
const channelRepo = new ChannelRepositoryImpl();
const streamRepo = new StreamRepositoryImpl();
const categoryRepo = new CategoryRepositoryImpl();
const countryRepo = new CountryRepositoryImpl();

const getChannels = new GetChannelsUseCase(channelRepo);
const getStreams = new GetStreamsUseCase(streamRepo);
const getCategories = new GetCategoriesUseCase(categoryRepo);
const getCountries = new GetCountriesUseCase(countryRepo);

// ─── Main server component ──────────────────────────────────────────
export default async function HomePage() {
  // Fetch all data in parallel (Next.js will deduplicate overlapping fetch calls)
  const [channels, streams, categories, countries] = await Promise.all([
    getChannels.execute({ excludeNsfw: true }),
    getStreams.executeAll(),
    getCategories.execute(),
    getCountries.execute(),
  ]);

  return (
    <Suspense fallback={<SkeletonGrid count={24} />}>
      <HomeClient
        channels={channels}
        streams={streams}
        categories={categories}
        countries={countries}
      />
    </Suspense>
  );
}
