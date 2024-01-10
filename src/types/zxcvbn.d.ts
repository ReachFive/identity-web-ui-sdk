declare module '@reachfive/zxcvbn' {

    interface Sequence {
        base_guesses: number
        dictionary_name: string
        guesses: number
        guesses_log10: number
        i: number
        j: number
        l33t: boolean
        l33t_variations: number
        matched_word: string
        pattern: string
        rank: number
        reversed: boolean
        token: string
        uppercase_variations: number
    }

    export interface ZxcvbnResult {
        /** estimated guesses needed to crack password */
        guesses: number
        /** order of magnitude of guesses */
        guesses_log10: number

        /** dictionary of back-of-the-envelope crack time estimations, in seconds, based on a few scenarios: */
        crack_times_seconds: {
            /** online attack on a service that ratelimits password auth attempts. */
            online_throttling_100_per_hour: number

            /** online attack on a service that doesn't ratelimit, 
             * or where an attacker has outsmarted ratelimiting.
             */
            online_no_throttling_10_per_second: number

            /** offline attack. assumes multiple attackers,
             * proper user-unique salting, and a slow hash function 
             * w/ moderate work factor, such as bcrypt, scrypt, PBKDF2.
             */
            offline_slow_hashing_1e4_per_second: number

            /** offline attack with user-unique salting but a fast hash
             * function like SHA-1, SHA-256 or MD5. A wide range of
             * reasonable numbers anywhere from one billion - one trillion
             * guesses per second, depending on number of cores and machines.
             * ballparking at 10B/sec.
             */
            offline_fast_hashing_1e10_per_second: number
        }

        /** same keys as crack_times_seconds,
         * with friendlier display string values:
         * "less than a second", "3 hours", "centuries", etc.
         */
        crack_times_display: {
            /** online attack on a service that ratelimits password auth attempts. */
            online_throttling_100_per_hour: string

            /** online attack on a service that doesn't ratelimit, 
             * or where an attacker has outsmarted ratelimiting.
             */
            online_no_throttling_10_per_second: string

            /** offline attack. assumes multiple attackers,
             * proper user-unique salting, and a slow hash function 
             * w/ moderate work factor, such as bcrypt, scrypt, PBKDF2.
             */
            offline_slow_hashing_1e4_per_second: string

            /** offline attack with user-unique salting but a fast hash
             * function like SHA-1, SHA-256 or MD5. A wide range of
             * reasonable numbers anywhere from one billion - one trillion
             * guesses per second, depending on number of cores and machines.
             * ballparking at 10B/sec.
             */
            offline_fast_hashing_1e10_per_second: string
        }

        /** Integer from 0-4 (useful for implementing a strength bar)
         * - 0 too guessable: risky password. (guesses < 10^3)
         * - 1 very guessable: protection from throttled online attacks. (guesses < 10^6)
         * - 2 somewhat guessable: protection from unthrottled online attacks. (guesses < 10^8)
         * - 3 safely unguessable: moderate protection from offline slow-hash scenario. (guesses < 10^10)
         * - 4 very unguessable: strong protection from offline slow-hash scenario. (guesses >= 10^10)
         */
        score: 0 | 1 | 2 | 3 | 4

        /** verbal feedback to help choose better passwords. set when score <= 2. */
        feedback: {
            has_suggestions: boolean
            /** explains what's wrong, eg. 'this is a top-10 common password'.
             *  not always set -- sometimes an empty string
             */
            warning: string

            /** a possibly-empty list of suggestions to help choose a less
             * guessable password. eg. 'Add another word or two'
             */
            suggestions: string[]
        } 
        
        /** the list of patterns that zxcvbn based the guess calculation on. */
        sequence: Sequence[]

        /** how long it took zxcvbn to calculate an answer, in milliseconds. */
        calc_time: number
    }

    export default function zxcvbn(password: string, user_inputs?: string[] = []): ZxcvbnResult
}
