import Navbar from "@/components/Navbar";
import StoryReader from "@/components/StoryReader";

export default function StoryPage({ params }: { params: { slug: string } }) {
  return (
    <>
      <Navbar />
      <StoryReader slug={params.slug} />
    </>
  );
}
