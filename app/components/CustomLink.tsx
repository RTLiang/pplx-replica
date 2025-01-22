import React from 'react';

interface CustomLinkProps {
    href: string;
    children: React.ReactNode;
}

const CustomLink: React.FC<CustomLinkProps> = ({ href, children }) => {
    return <a href={href}>{children}</a>;
};

export default CustomLink;
