interface EmptyListMessageProps {
  message: string;
}

export default function EmptyListMessage({ message }: EmptyListMessageProps) {
  return (
    <div className="py-4 text-center text-sm text-zinc-500">{message}</div>
  );
}
