import Head from 'next/head'

export const SEO = () => {
  return (
    <Head>
      <title>Playbook</title>
      <meta name='title' content='Striker' />
      <meta name='description' content='The playbook is a repository for FGC tech, contributed to by the community' />

      <meta property='og:site_name' content='Playbook' />

      <meta property='og:type' content='website' />
      <meta property='og:url' content='https://www.hyhy.gg/' />
      <meta property='og:title' content='Playbook' />
      <meta
        property='og:description'
        content='The playbook is a repository for FGC tech, contributed to by the community'
      />
      <meta property='og:image' content='' />

      <meta property='twitter:card' content='summary_large_image' />
      <meta property='twitter:url' content='https://www.hyhy.gg/' />
      <meta property='twitter:title' content='Playbook' />
      <meta
        property='twitter:description'
        content='The playbook is a repository for FGC tech, contributed to by the community'
      />
      <meta property='twitter:image' content='' />
    </Head>
  )
}