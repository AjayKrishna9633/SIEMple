export interface PasswordChangeNotifier {
    notify(email: string): Promise<void>;
}
