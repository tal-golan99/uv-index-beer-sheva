interface Props {
  message: string;
}

export default function ErrorBanner({ message }: Props) {
  return (
    <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200">
      {message}
    </p>
  );
}
