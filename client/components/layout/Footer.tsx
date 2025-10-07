import Container from "@/components/layout/Container";

export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <Container className="py-6">
        <div className="text-center text-sm text-muted-foreground">
          © 2025 PaperGen. All rights reserved.
        </div>
        <div className="mt-2 text-center text-xs text-muted-foreground">
          Developed by{" "}
          <a
            href="https://alihassan-online.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline"
          >
            Ali Hassan
          </a>{" "}
          &amp;{" "}
          <a
            href="https://waseemportfolioweb.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline"
          >
            Waseem Ali
          </a>
        </div>
      </Container>
    </footer>
  );
}
