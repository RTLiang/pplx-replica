import React from 'react';

interface CustomLinkProps {
    href: string;
    children: React.ReactNode;
}

const CustomLink: React.FC<CustomLinkProps> = ({ href, children }) => {
    return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
};

export default CustomLink;
