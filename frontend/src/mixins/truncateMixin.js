export default {
    methods: {
        truncateText(text, maxTotalLength = 60, maxWordLength = 20) {
            // Diviser le texte en mots et vérifier chaque mot individuellement
            let words = text.split(" ").map(word => {
                // Si un mot dépasse la longueur maximale définie
                if (word.length > maxWordLength) {
                    return word.slice(0, maxWordLength) + "...";
                }
                return word;
            });

            // Joindre les mots pour reformer le texte
            let truncatedText = words.join(" ");

            // Si la longueur totale du texte dépasse la limite maximale
            if (truncatedText.length > maxTotalLength) {
                return truncatedText.slice(0, maxTotalLength) + "...";
            }

            return truncatedText;
        }
    }
};
