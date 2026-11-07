export type Media = {
  id: number;
  title: string;
  type: string;
  year: number | null;
  description: string | null;
  image_url: string | null;
};

export default function MediaCard({ media }: { media: Media }) {
  return (
    <div className="media-card">
      {media.image_url ? (
        <img src={media.image_url} alt={media.title} />
      ) : (
        <div className="media-placeholder">No Image</div>
      )}

      <h3>{media.title}</h3>
      <p>
        {media.type} · {media.year ?? "Unknown"}
      </p>
    </div>
  );
}
