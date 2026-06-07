import type { NextPage } from "next";
import Head from "next/head";

const CollaboratorRevenuePage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Doanh thu | Cộng tác viên</title>
        <meta name="description" content="Doanh thu cộng tác viên" />
      </Head>
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">Doanh thu</h1>
        <p className="mt-2 text-slate-600">
          Báo cáo doanh thu đang được cập nhật.
        </p>
      </main>
    </>
  );
};

export default CollaboratorRevenuePage;
