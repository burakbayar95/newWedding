import { CalendarDays, Camera, Flower2, Heart } from 'lucide-react';
import FileUploader from './components/FileUploader';

export default function App() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fffaf5] text-ink">
      <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top_left,rgba(189,141,57,0.15),transparent_30%),radial-gradient(circle_at_top_right,rgba(127,147,111,0.15),transparent_28%),linear-gradient(180deg,#fff1ed_0%,rgba(255,250,245,0)_100%)]" />
      <div className="absolute left-6 top-32 hidden h-48 w-px rotate-12 bg-gold-100 lg:block" />
      <div className="absolute right-10 top-28 hidden h-56 w-px -rotate-12 bg-gold-100 lg:block" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-blush-600 shadow-sm">
              <Camera className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold tracking-normal text-stone-600">
              İdil &amp; Burak
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-gold-600">
            <CalendarDays className="h-5 w-5" aria-hidden="true" />
            <span>16.05.2026</span>
          </div>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center py-7 lg:py-9">
          <div className="w-full max-w-3xl text-center">
            <div className="mb-7 flex justify-center gap-2 sm:gap-4">
              <div className="-rotate-3 rounded-lg bg-white p-1.5 shadow-soft">
                <div className="h-24 w-20 rounded-md bg-[url('https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=480&q=80')] bg-cover bg-center sm:h-28 sm:w-24" />
              </div>
              <div className="mt-7 rounded-lg bg-white p-1.5 shadow-soft">
                <div className="h-24 w-20 rounded-md bg-[url('https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=480&q=80')] bg-cover bg-center sm:h-28 sm:w-24" />
              </div>
              <div className="rotate-3 rounded-lg bg-white p-1.5 shadow-soft">
                <div className="h-24 w-20 rounded-md bg-[url('https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=480&q=80')] bg-cover bg-center sm:h-28 sm:w-24" />
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 text-gold-600">
              <span className="h-px w-14 bg-gold-100" />
              <Heart className="h-5 w-5" aria-hidden="true" />
              <span className="h-px w-14 bg-gold-100" />
            </div>

            <h1 className="mt-4 text-5xl font-semibold leading-tight text-sage-700 sm:text-6xl lg:text-7xl">
              İdil &amp; Burak
            </h1>
            <h2 className="mt-2 text-3xl font-semibold leading-tight text-blush-600 sm:text-4xl">
              Nişan Anılarımız
            </h2>
            <p className="mt-3 inline-flex items-center justify-center gap-2 text-lg font-semibold text-gold-600">
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
              16.05.2026
            </p>
            <div className="mt-3 flex items-center justify-center gap-2 text-sage-600">
              <Flower2 className="h-4 w-4" aria-hidden="true" />
              <span className="h-px w-10 bg-sage-100" />
              <Flower2 className="h-4 w-4" aria-hidden="true" />
            </div>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-stone-600">
              Bizimle çektiğiniz güzel anıları buraya yükleyebilirsiniz.
            </p>
          </div>

          <div className="mt-8 w-full max-w-3xl">
            <FileUploader />
          </div>
        </section>
      </div>
    </main>
  );
}
