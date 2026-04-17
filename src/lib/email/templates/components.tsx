import { Body } from "@react-email/body";
import { Button } from "@react-email/button";
import { Container } from "@react-email/container";
import { Head } from "@react-email/head";
import { Hr } from "@react-email/hr";
import { Html } from "@react-email/html";
import { Link } from "@react-email/link";
import { Preview } from "@react-email/preview";
import { Section } from "@react-email/section";
import { Text } from "@react-email/text";

type EmailShellProps = {
  preview: string;
  title: string;
  children: React.ReactNode;
  ctaLabel: string;
  ctaHref: string;
};

export function EmailShell({
  preview,
  title,
  children,
  ctaLabel,
  ctaHref,
}: EmailShellProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={brandSection}>
            <Text style={brand}>Receps</Text>
          </Section>

          <Section style={card}>
            <Text style={titleStyle}>{title}</Text>
            <Section>{children}</Section>
            <Section style={{ marginTop: "24px" }}>
              <Button href={ctaHref} style={button}>
                {ctaLabel}
              </Button>
            </Section>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={footerText}>
              Receps Tecnologia Ltda. • Rua Exemplo, 123 • São Paulo/SP
            </Text>
            <Text style={footerText}>
              <Link href="https://app.receps.com.br/configuracoes/assinatura" style={link}>
                Gerenciar assinatura
              </Link>{" "}
              •{" "}
              <Link href="https://app.receps.com.br/privacidade" style={link}>
                Política de Privacidade
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function EmailParagraph({ children }: { children: React.ReactNode }) {
  return <Text style={paragraph}>{children}</Text>;
}

const body = {
  backgroundColor: "#f8fafc",
  fontFamily: "Inter, Arial, sans-serif",
  margin: 0,
  padding: "24px 0",
};

const container = {
  maxWidth: "560px",
  margin: "0 auto",
  padding: "0 16px",
};

const brandSection = {
  marginBottom: "16px",
};

const brand = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#7c3aed",
  margin: 0,
};

const card = {
  backgroundColor: "#ffffff",
  borderRadius: "20px",
  border: "1px solid #e2e8f0",
  padding: "32px",
};

const titleStyle = {
  fontSize: "28px",
  lineHeight: "34px",
  fontWeight: "700",
  color: "#0f172a",
  margin: "0 0 16px",
};

const paragraph = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#475569",
  margin: "0 0 14px",
};

const button = {
  display: "inline-block",
  backgroundColor: "#7c3aed",
  color: "#ffffff",
  padding: "14px 20px",
  borderRadius: "14px",
  textDecoration: "none",
  fontWeight: "700",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "20px 0",
};

const footerText = {
  fontSize: "12px",
  lineHeight: "20px",
  color: "#64748b",
  margin: "0 0 8px",
};

const link = {
  color: "#7c3aed",
};
