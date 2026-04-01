export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        {/* Pulse Animation Container */}
        <div className="w-16 h-16 rounded-md bg-light-accent dark:bg-dark-accent mx-auto mb-8 animate-pulse" />

        {/* Loading Text */}
        <h2 className="text-2xl font-bold text-light-text dark:text-dark-text mb-4">
          Loading
        </h2>

        {/* Animated Dots */}
        <div className="flex justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-light-accent dark:bg-dark-accent animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-2 h-2 rounded-full bg-light-accent dark:bg-dark-accent animate-bounce" style={{ animationDelay: '0.15s' }} />
          <div className="w-2 h-2 rounded-full bg-light-accent dark:bg-dark-accent animate-bounce" style={{ animationDelay: '0.3s' }} />
        </div>
      </div>
    </div>
  );
}
