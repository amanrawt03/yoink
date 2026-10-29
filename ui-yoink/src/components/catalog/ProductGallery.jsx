export default function ProductGallery({ name, images }) {
  return (
    <div className={`detail-gallery${images.length === 1 ? ' single-image' : ''}`}>
      {images.map((image, index) => (
        <img
          key={`${image}-${index}`}
          src={image}
          alt={`${name}${index ? `, view ${index + 1}` : ''}`}
        />
      ))}
    </div>
  );
}
