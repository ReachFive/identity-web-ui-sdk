export function createClient(creationConfig: Config): Client

interface Client {
    showAuth(options: any): Promise<void>,
    showEmailEditor(options: any): Promise<void>,
    showPasswordEditor(options: any): Promise<void>,
    showPhoneNumberEditor(options: any): Promise<void>,
    showPasswordReset(options: any): Promise<void>,
    showPasswordless(options: any): Promise<void>,
    showProfileEditor(options: any): Promise<void>,
    showSocialAccounts(options: any): Promise<void>,
    showSocialLogin(options: any): Promise<void>,
}

interface Config {
    clientId: string,
    domain: string,
    language?: string,
}
