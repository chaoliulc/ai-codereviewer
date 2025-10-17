export interface PRDetails {
    owner: string;
    repo: string;
    pull_number: number;
    title: string;
    description: string;
}

export interface EventData {
    repository: {
        owner: {
            login: string;
        };
        name: string;
    };
    number: number;
    action: string;
    before: string;
    after: string;
}