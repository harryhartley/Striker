import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from 'next'
import { getProviders, signIn } from 'next-auth/react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '~/server/auth'
import { Button } from 'src/components/ui/button'

export default function SignIn({
  providers,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <div className="flex justify-center space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-16">
      {Object.values(providers).map((provider) => (
        <Button
          variant={'outline'}
          className="max-w-[42rem] text-lg leading-normal sm:text-xl sm:leading-8"
          key={provider.name}
          onClick={() => void signIn(provider.id)}
        >
          Sign in with {provider.name}
        </Button>
      ))}
    </div>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (session) {
    return { redirect: { destination: '/' } }
  }

  const providers = await getProviders()

  return {
    props: { providers: providers ?? [] },
  }
}
