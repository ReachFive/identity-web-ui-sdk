import React from 'react';

import { marked } from '@/components/miscComponent';
import { cn } from '@/lib/utils';

type UserAgreementProps = React.ComponentProps<'div'> & {
    content: string;
};

const UserAgreement = ({ className, content, ...props }: UserAgreementProps) => {
    return (
        <div
            key="user-agreement"
            data-testid="user-agreement"
            id="user-agreement"
            className={cn(
                'text-sm text-muted-foreground text-center space-y-2 [&_a]:text-muted-foreground [&_a]:underline [&_a]:hover:text-primary',
                className
            )}
            {...props}
            dangerouslySetInnerHTML={{ __html: marked.parse(content, { async: false }) }}
        />
    );
};
UserAgreement.displayName = 'UserAgreement';

export { UserAgreement };
